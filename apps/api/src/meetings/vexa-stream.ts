import type { MeetingStatus } from "./contract";
import { ingestEvents, type Ingestion } from "./ingest";
import { meetingCode } from "./meeting-url";
import type { Notetaker } from "./routes";
import { isFinished } from "./status";
import type { VexaClient, VexaConfig } from "./vexa-client";
import { readStreamFrame, readTranscriptRecord, type ProviderEvent } from "./vexa-events";

// The live stream carries segments as they are confirmed; a catch-up read
// of the REST transcript runs on every (re)subscribe, on a terminal status
// (for its reason), and on a slow timer, so a gap in the stream, or a frame
// shape this reader does not know, delays a line but never loses it.
const CATCH_UP_MS = 15_000;
// A session Vexa has said nothing about after this long never got a bot.
const SILENT_LIMIT_MS = 5 * 60_000;
const PING_MS = 25_000;
const MAX_BACKOFF_MS = 30_000;

type Socket = Pick<WebSocket, "send" | "close" | "addEventListener">;

type WatcherDeps = {
  config: VexaConfig;
  client: Pick<VexaClient, "readTranscript">;
  ingestion: Ingestion;
  /** The session as the watcher needs it, or null if it no longer exists. */
  sessionOf: (
    sessionId: string,
  ) => { status: MeetingStatus; providerBotId: string | null; startedAt: string } | null;
  /** Fails a session Vexa never reported on (the bot request never reached it). */
  giveUp: (sessionId: string) => void;
  connect?: (url: string, apiKey: string) => Socket;
};

const bunSocket = (url: string, apiKey: string): Socket =>
  new WebSocket(url, { headers: { "X-API-Key": apiKey } });

function streamUrl(apiUrl: string): string {
  const url = new URL("/ws", apiUrl);
  url.protocol = url.protocol === "http:" ? "ws:" : "wss:";
  return url.href;
}

function parseFrame(raw: unknown): { type?: unknown; error?: unknown } | null {
  try {
    return JSON.parse(String(raw)) as { type?: unknown; error?: unknown };
  } catch {
    return null;
  }
}

const isEnd = (event: ProviderEvent) =>
  event.kind === "status" &&
  (event.report.status === "completed" || event.report.status === "failed");

/** Follows one session's meeting until it ends. Returns how to stop early. */
function follow(
  deps: Required<WatcherDeps> & { onStop: () => void },
  { sessionId, code }: { sessionId: string; code: string },
) {
  const { config, client, ingestion, sessionOf, giveUp, connect, onStop } = deps;
  const watchedSince = Date.now();
  let socket: Socket | undefined;
  let ping: ReturnType<typeof setInterval> | undefined;
  let attempt = 0;
  let stopped = false;
  const finished = () => {
    const session = sessionOf(sessionId);
    return session === null || isFinished(session.status);
  };
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearInterval(ping);
    clearInterval(timer);
    socket?.close();
    onStop();
  };
  const apply = (events: ProviderEvent[]) => {
    ingestEvents(ingestion, sessionId, events);
    if (finished()) stop();
  };
  /** `final`: the read after the stream reported the end, for its reason. */
  const catchUp = async (final = false) => {
    const session = sessionOf(sessionId);
    if (!session || (isFinished(session.status) && !final)) return stop();
    try {
      const record = await client.readTranscript({ code, meetingId: session.providerBotId });
      const receivedAt = new Date().toISOString();
      apply(readTranscriptRecord(record, { receivedAt, notBefore: session.startedAt }));
    } catch (error) {
      console.warn(`Vexa catch-up for ${code} failed`, error);
    }
  };
  const tick = () => {
    const session = sessionOf(sessionId);
    if (session?.status === "requested" && Date.now() - watchedSince > SILENT_LIMIT_MS) {
      giveUp(sessionId);
      return stop();
    }
    void catchUp();
  };
  const onMessage = (raw: unknown) => {
    const frame = parseFrame(raw);
    if (!frame) return;
    if (frame.type === "subscribed") {
      // Only a confirmed subscription counts as a good connection for backoff.
      attempt = 0;
      return void catchUp();
    }
    if (frame.type === "error") console.warn(`Vexa stream error for ${code}`, frame.error);
    const events = readStreamFrame(frame, new Date().toISOString());
    apply(events);
    // The stream says *that* the meeting ended; the record says why.
    if (events.some(isEnd)) void catchUp(true);
  };
  const open = () => {
    if (stopped) return;
    const current = connect(streamUrl(config.apiUrl), config.apiKey);
    socket = current;
    current.addEventListener("open", () => {
      const meetings = [{ platform: "google_meet", native_id: code }];
      current.send(JSON.stringify({ action: "subscribe", meetings }));
      ping = setInterval(() => current.send(JSON.stringify({ action: "ping" })), PING_MS);
    });
    current.addEventListener("message", (event) => onMessage(event.data));
    current.addEventListener("close", () => {
      clearInterval(ping);
      if (stopped) return;
      if (finished()) return stop();
      setTimeout(open, Math.min(1000 * 2 ** attempt++, MAX_BACKOFF_MS));
    });
  };
  const timer = setInterval(tick, CATCH_UP_MS);
  open();
  return stop;
}

/**
 * Follows meetings on Vexa's `/ws` stream, one subscription per live
 * session, until the session ends. Reconnects with backoff.
 */
export function createVexaWatcher({ connect = bunSocket, ...deps }: WatcherDeps) {
  const watched = new Map<string, () => void>();
  return {
    watch(sessionId: string, code: string): void {
      if (watched.has(sessionId)) return;
      const onStop = () => void watched.delete(sessionId);
      const stop = follow({ ...deps, connect, onStop }, { sessionId, code });
      watched.set(sessionId, stop);
    },
    stopAll(): void {
      for (const stop of [...watched.values()]) stop();
    },
  };
}

export type VexaWatcher = ReturnType<typeof createVexaWatcher>;

/** The notetaker: a Vexa bot, followed on the stream unless Vexa definitely refused it. */
export function createVexaNotetaker(
  client: Pick<VexaClient, "sendBot">,
  watcher: Pick<VexaWatcher, "watch">,
): Notetaker {
  return {
    async requestBot({ meetingUrl, sessionId }) {
      const code = meetingCode(meetingUrl);
      const answer = await client.sendBot(code);
      if (answer.ok || answer.outcome === "unconfirmed") watcher.watch(sessionId, code);
      return answer;
    },
  };
}
