import type { LiveFeed } from "../live-feed";
import type { MeetingSession, TranscriptUtterance } from "./contract";
import {
  readWebhook,
  type NewUtterance,
  type ProviderEvent,
  type StatusReport,
  type WebhookTarget,
} from "./vexa-events";

/** What ingestion needs from meeting storage. */
export interface IngestionStore {
  recordUtterance(
    sessionId: string,
    utterance: NewUtterance,
    receivedAt: string,
  ): TranscriptUtterance | null;
  recordStatus(sessionId: string, report: StatusReport): MeetingSession | null;
  findForProvider(target: WebhookTarget): { id: string } | null;
}

/** What ingestion needs from the webhook delivery inbox. */
export interface DeliveryQueue {
  pending(retryFailed?: boolean): { id: string; payload: string }[];
  settle(id: string, error: string | null, at: string): void;
}

export type Ingestion = {
  meetings: IngestionStore;
  feed: Pick<LiveFeed, "publish">;
  /** Told after a session gained utterances or changed status (analysis listens). */
  onMeetingChanged?: (sessionId: string) => void;
};

/**
 * Applies provider events to one session: stores what is new and publishes
 * it. Repeats change nothing, so any path may deliver the same event again.
 * Drafts are only published: they are not the meeting's record.
 */
export function ingestEvents(
  { meetings, feed, onMeetingChanged }: Ingestion,
  sessionId: string,
  events: ProviderEvent[],
): void {
  const receivedAt = new Date().toISOString();
  let changed = false;
  for (const event of events) {
    if (event.kind === "draft") {
      feed.publish(sessionId, { type: "draft", data: event.draft });
    } else if (event.kind === "utterance") {
      const utterance = meetings.recordUtterance(sessionId, event.utterance, receivedAt);
      if (utterance) feed.publish(sessionId, { type: "utterance", data: utterance });
      changed ||= utterance !== null;
    } else {
      const session = meetings.recordStatus(sessionId, event.report);
      if (session) feed.publish(sessionId, { type: "session", data: session });
      changed ||= session !== null;
    }
  }
  if (changed) onMeetingChanged?.(sessionId);
}

/**
 * Processes pending webhook deliveries, oldest first. Synchronous, so two
 * drains never interleave. A delivery that fails is kept with its error and
 * payload; `retryFailed` (at startup) tries those again, which is safe
 * because ingestion is idempotent.
 */
export function drainDeliveries(
  deps: Ingestion & { inbox: DeliveryQueue },
  { retryFailed = false } = {},
): void {
  for (const delivery of deps.inbox.pending(retryFailed)) {
    let error: string | null = null;
    try {
      const webhook = readWebhook(JSON.parse(delivery.payload));
      // Unrecognized events, or meetings this app did not start, are not ours.
      const session = webhook && deps.meetings.findForProvider(webhook.target);
      if (webhook && session) {
        ingestEvents(deps, session.id, [{ kind: "status", report: webhook.report }]);
      }
    } catch (cause) {
      console.error(`Provider delivery ${delivery.id} failed`, cause);
      error = cause instanceof Error ? cause.message : String(cause);
    }
    deps.inbox.settle(delivery.id, error, new Date().toISOString());
  }
}
