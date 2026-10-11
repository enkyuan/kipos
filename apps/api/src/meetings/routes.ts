import { Elysia, t } from "elysia";
import { apiError, apiErrorSchema } from "../errors";
import {
  meetingSessionSchema,
  transcriptUtteranceSchema,
  type MeetingSession,
  type TranscriptUtterance,
} from "./contract";
import type { LiveEvent, LiveFeed } from "../live-feed";
import { EVENT_STREAM_HEADERS, meetingEventStream } from "./event-stream";
import { canonicalMeetUrl } from "./meeting-url";

/** What the meeting routes need from storage. */
export interface MeetingStore {
  /** A new session in `requested`, or the meeting's live one (`created: false`). */
  start(meetingUrl: string, at: string): { session: MeetingSession; created: boolean };
  attachBot(id: string, providerBotId: string): MeetingSession;
  fail(id: string, message: string, at: string): MeetingSession;
  noteUnconfirmed(id: string, message: string): MeetingSession;
  find(id: string): MeetingSession | null;
  /** Every session, newest first. */
  list(): MeetingSession[];
  transcript(id: string): TranscriptUtterance[];
}

/**
 * `refused`: the provider definitely sent no bot. `unconfirmed`: the request
 * may or may not have reached it (a timeout, a 5xx), so a bot may still join.
 */
export type BotRequest =
  | { ok: true; botId: string }
  | { ok: false; outcome: "refused" | "unconfirmed"; message: string };

/**
 * Sends a notetaker bot to a meeting and follows it. Never throws: a
 * failure is a message for the person.
 */
export interface Notetaker {
  requestBot(meeting: { meetingUrl: string; sessionId: string }): Promise<BotRequest>;
}

type MeetingRoutesDeps = {
  meetings: MeetingStore;
  notetaker: Notetaker;
  feed: Pick<LiveFeed, "subscribe">;
  /** Other features' persisted state for a meeting, replayed after the transcript. */
  snapshotExtras?: (sessionId: string) => LiveEvent[];
};

const notFound = apiError("not_found", "No meeting session has this id.");
const sessionResponses = { 404: apiErrorSchema };

export function meetingRoutes({ meetings, notetaker, feed, snapshotExtras }: MeetingRoutesDeps) {
  return new Elysia()
    .post(
      "/api/meetings",
      async ({ body, status }) => {
        if (!body.authorized) {
          throw status(
            422,
            apiError(
              "authorization_required",
              "Confirm that everyone in the meeting agreed to be recorded before starting the notetaker.",
            ),
          );
        }
        const meetingUrl = canonicalMeetUrl(body.meetingUrl);
        if (!meetingUrl) {
          throw status(
            422,
            apiError(
              "invalid_meeting_url",
              "Enter a Google Meet link like https://meet.google.com/abc-defg-hij.",
            ),
          );
        }
        const { session, created } = meetings.start(meetingUrl, new Date().toISOString());
        // A repeated start joins the session already running: one bot per meeting.
        if (!created) return status(200, session);
        const bot = await notetaker.requestBot({ meetingUrl, sessionId: session.id });
        if (bot.ok) return status(201, meetings.attachBot(session.id, bot.botId));
        // Unconfirmed: a bot may still join, so the session keeps the meeting.
        if (bot.outcome === "unconfirmed") {
          return status(201, meetings.noteUnconfirmed(session.id, bot.message));
        }
        return status(201, meetings.fail(session.id, bot.message, new Date().toISOString()));
      },
      {
        body: t.Object({
          meetingUrl: t.String({ maxLength: 2048 }),
          /** The person's explicit confirmation that participants consented. */
          authorized: t.Boolean(),
        }),
        response: { 200: meetingSessionSchema, 201: meetingSessionSchema, 422: apiErrorSchema },
      },
    )
    .get("/api/meetings", () => meetings.list(), {
      response: { 200: t.Array(meetingSessionSchema) },
    })
    .get(
      "/api/meetings/:id",
      ({ params, status }) => meetings.find(params.id) ?? status(404, notFound),
      { response: { 200: meetingSessionSchema, ...sessionResponses } },
    )
    .get(
      "/api/meetings/:id/transcript",
      ({ params, status }) =>
        meetings.find(params.id) ? meetings.transcript(params.id) : status(404, notFound),
      { response: { 200: t.Array(transcriptUtteranceSchema), ...sessionResponses } },
    )
    .get(
      "/api/meetings/:id/events",
      ({ params, request, status }) => {
        if (!meetings.find(params.id)) return status(404, notFound);
        const snapshot = () => {
          const session = meetings.find(params.id);
          if (!session) return [];
          const utterances = meetings.transcript(params.id);
          return [
            { type: "session", data: session },
            ...utterances.map((utterance) => ({ type: "utterance", data: utterance })),
            ...(snapshotExtras?.(params.id) ?? []),
          ];
        };
        const body = meetingEventStream({ sessionId: params.id, feed, snapshot }, request.signal);
        return new Response(body, { headers: EVENT_STREAM_HEADERS });
      },
      { response: sessionResponses },
    );
}
