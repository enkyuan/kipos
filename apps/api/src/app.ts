import { Elysia } from "elysia";
import type { AnalysisState } from "./analysis/contract";
import { analysisRoutes } from "./analysis/routes";
import { publicIssue, type AnalysisScheduler, type TranscriptReader } from "./analysis/scheduler";
import type { AnalysisStore } from "./analysis/store";
import { errorBoundary } from "./errors";
import { healthRoutes } from "./health/routes";
import type { LiveEvent, LiveFeed } from "./live-feed";
import { drainDeliveries, type DeliveryQueue, type IngestionStore } from "./meetings/ingest";
import { meetingRoutes, type MeetingStore, type Notetaker } from "./meetings/routes";
import { providerWebhookRoutes, type DeliveryInbox } from "./meetings/webhook-routes";

export type AppDependencies = {
  meetings: MeetingStore &
    IngestionStore &
    TranscriptReader & { latestUtteranceId(id: string): number };
  inbox: DeliveryInbox & DeliveryQueue;
  analysisStore: AnalysisStore;
  /** Null when no model is configured: analysis is off, everything else works. */
  analysis: Pick<AnalysisScheduler, "notify" | "stateOf"> | null;
  notetaker: Notetaker;
  feed: LiveFeed;
  /** Shared secret for Vexa webhooks; empty rejects every delivery. */
  webhookSecret: string;
};

const ANALYSIS_OFF: AnalysisState = { enabled: false, state: "idle", analyzedAt: null };

/**
 * The whole HTTP surface as a function of its dependencies. `server.ts` and
 * tests supply them (stores through `createStores(db)`); tests call
 * `app.handle(request)` without opening a port. Each feature is one plugin
 * here plus its stores in `stores.ts`.
 */
export function createApp(deps: AppDependencies) {
  const { meetings, feed, analysisStore } = deps;
  const analysisState = (id: string) => deps.analysis?.stateOf(id) ?? ANALYSIS_OFF;
  const ingestion = { meetings, feed, onMeetingChanged: (id: string) => deps.analysis?.notify(id) };
  // A macrotask, so the webhook's acknowledgement is sent before processing.
  const ingestSoon = () =>
    setTimeout(() => drainDeliveries({ ...ingestion, inbox: deps.inbox }), 0);
  // The live channel replays analysis after the transcript, so a reconnect
  // (or a refresh) shows the same state.
  const snapshotExtras = (id: string): LiveEvent[] => [
    { type: "analysis", data: analysisState(id) },
    ...analysisStore.requirements(id).map((data) => ({ type: "requirement", data })),
    ...analysisStore.issues(id).map((issue) => ({ type: "issue", data: publicIssue(issue) })),
  ];

  return new Elysia()
    .use(errorBoundary)
    .use(healthRoutes)
    .use(meetingRoutes({ ...deps, snapshotExtras }))
    .use(
      analysisRoutes({
        store: analysisStore,
        state: analysisState,
        meetingExists: (id) => meetings.find(id) !== null,
        latestUtteranceId: (id) => meetings.latestUtteranceId(id),
        publishIssue: (id, issue) => feed.publish(id, { type: "issue", data: issue }),
      }),
    )
    .use(
      providerWebhookRoutes({
        secret: deps.webhookSecret,
        inbox: deps.inbox,
        onAccepted: ingestSoon,
      }),
    );
}

/** The type `apps/web` builds its Eden client from. */
export type App = ReturnType<typeof createApp>;

export type { AnalysisState, BusinessRequirement, CandidateIssue } from "./analysis/contract";
export type {
  DraftSpeech,
  MeetingSession,
  MeetingStatus,
  TranscriptUtterance,
} from "./meetings/contract";
