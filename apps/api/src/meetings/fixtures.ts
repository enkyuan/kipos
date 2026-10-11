import { createHmac } from "node:crypto";
import { createApp } from "../app";
import { openDatabase } from "../database";
import { createLiveFeed } from "../live-feed";
import { createStores } from "../stores";
import { ingestEvents } from "./ingest";
import type { BotRequest } from "./routes";
import { readStreamFrame } from "./vexa-events";

// Test doubles stand in for Vexa only; storage is a real in-memory SQLite
// database, migrated like production. Payloads follow docs.vexa.ai.

const SECRET = "test-webhook-secret";

/** `answer` overrides the fake Vexa reply; by default each request gets a new meeting id. */
export function createTestApp(answer?: BotRequest) {
  const db = openDatabase(":memory:");
  const stores = createStores(db);
  const feed = createLiveFeed();
  const requests: { meetingUrl: string; sessionId: string }[] = [];
  const app = createApp({
    ...stores,
    analysis: null,
    feed,
    notetaker: {
      async requestBot(meeting) {
        requests.push(meeting);
        return answer ?? { ok: true, botId: String(requests.length) };
      },
    },
    webhookSecret: SECRET,
  });
  /** Delivers frames as the live stream would. */
  const stream = (sessionId: string, ...frames: unknown[]) => {
    const { startedAt } = stores.meetings.find(sessionId)!;
    for (const frame of frames) {
      const receivedAt = new Date().toISOString();
      ingestEvents(
        { meetings: stores.meetings, feed },
        sessionId,
        readStreamFrame(frame, { receivedAt, startedAt }),
      );
    }
  };
  return { app, db, stores, feed, requests, stream };
}

export function signedVexaRequest(
  payload: unknown,
  { secret = SECRET, timestamp = Math.floor(Date.now() / 1000) } = {},
) {
  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return new Request("http://test/api/webhooks/vexa", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-webhook-timestamp": String(timestamp),
      "x-webhook-signature": `sha256=${signature}`,
    },
    body,
  });
}

export const startRequest = (meetingUrl: string, authorized = true) =>
  new Request("http://test/api/meetings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ meetingUrl, authorized }),
  });

type SegmentInput = { text: string; start: number; end?: number; speaker?: string; id?: string };

export const segment = ({ text, start, end = start + 1, speaker = "Ada", id }: SegmentInput) => ({
  segment_id: id ?? `sess:${speaker}:${start * 1000}`,
  speaker,
  text,
  start,
  end,
  language: "en",
  completed: true,
  absolute_start_time: new Date(Date.UTC(2026, 9, 11, 10, 0, start)).toISOString(),
});

/** The current `/ws` transcript bundle: confirmed segments plus drafts. */
export const transcriptFrame = (confirmed: unknown[], pending: unknown[] = []) => ({
  type: "transcript",
  speaker: "Ada",
  confirmed,
  pending,
});

export const statusFrame = (status: string, ts: string) => ({
  type: "meeting.status",
  meeting: { platform: "google_meet", native_id: "abc-defg-hij" },
  payload: { status },
  ts,
});

/** A signed-webhook envelope (webhook.v1, `meeting.status_change`). */
export function statusWebhook(input: {
  eventId?: string;
  meetingId: string | null;
  to: string;
  at: string;
  reason?: string;
}) {
  return {
    event_id: input.eventId ?? crypto.randomUUID(),
    event_type: "meeting.status_change",
    api_version: "2026-07-28",
    created_at: input.at,
    data: {
      meeting: {
        id: input.meetingId === null ? undefined : Number(input.meetingId),
        platform: "google_meet",
        native_meeting_id: "abc-defg-hij",
        status: input.to,
        completion_reason: input.reason ?? null,
      },
      status_change: { from: null, to: input.to, timestamp: input.at },
    },
  };
}

/** Lets the webhook's deferred ingestion run. */
export const settle = () => new Promise((resolve) => setTimeout(resolve, 5));
