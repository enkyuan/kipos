import { t, type Static } from "elysia";

/**
 * The meeting records the API returns and streams. They are normalized from
 * provider events and are the application's source of truth; the provider's
 * raw payloads never leave the ingestion path.
 */
export const meetingSessionSchema = t.Object({
  id: t.String(),
  meetingUrl: t.String(),
  providerBotId: t.Nullable(t.String()),
  /**
   * `requested` until the provider reports the bot; `recording` only once
   * the provider reports it admitted and transcribing. Nothing else means
   * "listening". `needs_help`: the bot is stuck joining and needs a person.
   */
  status: t.UnionEnum([
    "requested",
    "joining",
    "waiting_room",
    "needs_help",
    "recording",
    "ended",
    "failed",
  ]),
  startedAt: t.String(),
  endedAt: t.Nullable(t.String()),
  /**
   * Why the session failed; or, while `requested`, why the provider has not
   * confirmed the bot yet. Null otherwise.
   */
  errorMessage: t.Nullable(t.String()),
});

export type MeetingSession = Static<typeof meetingSessionSchema>;
export type MeetingStatus = MeetingSession["status"];

/** A finalized utterance. Times are seconds from the start of the recording. */
export const transcriptUtteranceSchema = t.Object({
  id: t.Number(),
  meetingSessionId: t.String(),
  /** Null when the provider could not attribute the speech: an unknown speaker. */
  speakerId: t.Nullable(t.String()),
  speakerName: t.Nullable(t.String()),
  text: t.String(),
  startTime: t.Number(),
  endTime: t.Number(),
  receivedAt: t.String(),
});

export type TranscriptUtterance = Static<typeof transcriptUtteranceSchema>;
