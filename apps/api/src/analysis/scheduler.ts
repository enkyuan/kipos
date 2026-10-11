import type { LiveFeed } from "../live-feed";
import type { Analyzer } from "./analyzer";
import type { AnalysisState, CandidateIssue } from "./contract";
import { parseModelOutput } from "./model-output";
import { planChanges, type StoredIssue } from "./plan";
import { buildPrompt, type TranscriptLine } from "./prompt";
import type { AnalysisStore } from "./store";

// A cycle covers about 25 s of conversation: enough for a requirement and
// its follow-up, few enough calls to stay cheap. A shorter batch is flushed
// after 30 s of waiting, or when the meeting ends.
const WINDOW_SECONDS = 25;
const MAX_WAIT_MS = 30_000;
const MAX_BATCH = 80;
const CONTEXT_LINES = 30;
const RETRY_MS = 10_000;
const MAX_RETRY_MS = 120_000;
// A batch the model answers invalidly twice is skipped (it stays in later
// context), so one bad answer cannot stall the meeting's analysis. A model
// that cannot be reached is retried with backoff; its batch is never skipped.
const MAX_ATTEMPTS = 2;

/** What analysis needs from the transcript. */
export interface TranscriptReader {
  utterancesAfter(sessionId: string, afterId: number, limit: number): TranscriptLine[];
  utterancesBefore(sessionId: string, beforeId: number, limit: number): TranscriptLine[];
  utteranceIds(sessionId: string): Set<number>;
}

type SchedulerDeps = {
  store: AnalysisStore;
  transcript: TranscriptReader;
  analyze: Analyzer;
  feed: Pick<LiveFeed, "publish">;
  /** Whether the meeting has ended (its last short batch is flushed at once). */
  isFinished: (sessionId: string) => boolean;
  newId?: () => string;
};

/** The issue fields the browser sees (the dismissal watermark stays server-side). */
export function publicIssue(issue: StoredIssue): CandidateIssue {
  const visible: CandidateIssue & { dismissedAtUtteranceId?: number | null } = { ...issue };
  delete visible.dismissedAtUtteranceId;
  return visible;
}

class InvalidOutput extends Error {
  constructor(problems: string[]) {
    super(`model output failed validation: ${problems.join("; ")}`);
  }
}

type CycleDeps = Omit<SchedulerDeps, "isFinished" | "newId"> & { newId: () => string };

/**
 * One analysis cycle: prompt, validate, plan, persist, publish. Throws on a
 * model or validation failure, before anything is written.
 */
async function analyzeBatch(
  deps: CycleDeps,
  sessionId: string,
  batch: TranscriptLine[],
): Promise<void> {
  const { store, transcript, analyze, feed, newId } = deps;
  const known = { requirements: store.requirements(sessionId), issues: store.issues(sessionId) };
  const context = transcript.utterancesBefore(sessionId, batch[0]!.id, CONTEXT_LINES);
  const parsed = parseModelOutput(await analyze(buildPrompt({ ...known, context, batch })));
  if (!parsed.ok) throw new InvalidOutput(parsed.problems);
  const now = new Date().toISOString();
  const utteranceIds = transcript.utteranceIds(sessionId);
  const plan = planChanges(parsed.output, { ...known, utteranceIds }, { sessionId, now, newId });
  if (plan.rejected.length) console.warn(`analysis ${sessionId}: rejected`, plan.rejected);
  const cursor = batch.at(-1)!.id;
  store.commit(sessionId, {
    requirements: plan.requirements,
    issues: plan.issues,
    cursor,
    at: now,
  });
  for (const data of plan.requirements) feed.publish(sessionId, { type: "requirement", data });
  for (const issue of plan.issues)
    feed.publish(sessionId, { type: "issue", data: publicIssue(issue) });
}

/**
 * Runs incremental analysis per meeting: told when the transcript grows,
 * it batches new utterances past the meeting's cursor, analyzes one batch
 * at a time (never two at once for a meeting), and publishes what changed.
 */
export function createAnalysisScheduler(deps: SchedulerDeps) {
  const { store, transcript, feed, isFinished } = deps;
  const cycleDeps = { ...deps, newId: deps.newId ?? (() => crypto.randomUUID()) };
  const running = new Set<string>();
  const dirty = new Set<string>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const attempts = new Map<string, number>();
  const states = new Map<string, AnalysisState["state"]>();

  const publishState = (sessionId: string, state: AnalysisState["state"]) => {
    states.set(sessionId, state);
    feed.publish(sessionId, { type: "analysis", data: stateOf(sessionId) });
  };
  const stateOf = (sessionId: string): AnalysisState => ({
    enabled: true,
    state: states.get(sessionId) ?? "idle",
    analyzedAt: store.cursor(sessionId).analyzedAt,
  });
  const later = (sessionId: string, ms: number) => {
    clearTimeout(timers.get(sessionId));
    timers.set(
      sessionId,
      setTimeout(() => notify(sessionId), ms),
    );
  };

  function notify(sessionId: string): void {
    if (running.has(sessionId)) return void dirty.add(sessionId);
    const batch = transcript.utterancesAfter(
      sessionId,
      store.cursor(sessionId).lastUtteranceId,
      MAX_BATCH,
    );
    if (batch.length === 0) return;
    const spoken =
      Math.max(...batch.map((u) => u.endTime)) - Math.min(...batch.map((u) => u.startTime));
    const waited = Date.now() - Date.parse(batch[0]!.receivedAt);
    const ready = spoken >= WINDOW_SECONDS || waited >= MAX_WAIT_MS || batch.length >= MAX_BATCH;
    if (!ready && !isFinished(sessionId)) return later(sessionId, MAX_WAIT_MS - waited);
    clearTimeout(timers.get(sessionId));
    void run(sessionId, batch);
  }

  async function run(sessionId: string, batch: TranscriptLine[]): Promise<void> {
    running.add(sessionId);
    publishState(sessionId, "analyzing");
    let succeeded = false;
    try {
      await analyzeBatch(cycleDeps, sessionId, batch);
      attempts.delete(sessionId);
      succeeded = true;
      publishState(sessionId, "idle");
    } catch (error) {
      // The transcript is untouched and nothing is fabricated; a later cycle proceeds.
      console.error(`analysis ${sessionId} failed`, error);
      const tries = (attempts.get(sessionId) ?? 0) + 1;
      attempts.set(sessionId, tries);
      if (error instanceof InvalidOutput && tries >= MAX_ATTEMPTS) {
        attempts.delete(sessionId);
        const at = new Date().toISOString();
        store.commit(sessionId, { requirements: [], issues: [], cursor: batch.at(-1)!.id, at });
      }
      publishState(sessionId, "failed");
      later(sessionId, Math.min(RETRY_MS * 2 ** (tries - 1), MAX_RETRY_MS));
    } finally {
      running.delete(sessionId);
      // After a failure, only the retry timer runs the next cycle.
      if (dirty.delete(sessionId) && succeeded) notify(sessionId);
    }
  }

  return {
    notify,
    stateOf,
    stopAll(): void {
      for (const timer of timers.values()) clearTimeout(timer);
    },
  };
}

export type AnalysisScheduler = ReturnType<typeof createAnalysisScheduler>;
