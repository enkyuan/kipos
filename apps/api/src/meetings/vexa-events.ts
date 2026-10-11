import type { DraftSpeech } from "./contract";

/** A finalized utterance as read from a provider message, before it is stored. */
export type NewUtterance = {
  /** The provider's segment id: the same segment, however delivered, is one utterance. */
  dedupKey: string;
  speakerId: string | null;
  speakerName: string | null;
  text: string;
  startTime: number;
  endTime: number;
};

/** One lifecycle report, in Vexa's vocabulary (`awaiting_admission`, `active`, ...). */
export type StatusReport = { status: string; reason: string | null; at: string };

export type ProviderEvent =
  | { kind: "utterance"; utterance: NewUtterance }
  | { kind: "draft"; draft: DraftSpeech }
  | { kind: "status"; report: StatusReport };

type Json = Record<string, unknown>;

const object = (value: unknown): Json | undefined =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Json)
    : undefined;
const text = (value: unknown) => (typeof value === "string" ? value : undefined);
const list = (value: unknown) => (Array.isArray(value) ? value : []);
const seconds = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
const validTime = (value: unknown) => {
  const at = text(value);
  return at && !Number.isNaN(Date.parse(at)) ? at : undefined;
};

/** What a provider message is read against. */
export type Reading = {
  receivedAt: string;
  /** The session's start (ISO): utterance times count from it. */
  startedAt: string;
};

// Vexa times segments either in seconds from its start or, on the live
// stream, in Unix epoch seconds. A value this large is a wall-clock time
// (September 2001 on): no meeting runs for 31 years.
const EPOCH_FLOOR_S = 1e9;

/**
 * Seconds from the session's start. One fixed origin per session gives a
 * segment the same time on every delivery path, which keeps spoken order
 * and the fallback dedup key stable.
 */
const fromStart = (time: number, startedAtMs: number) =>
  time < EPOCH_FLOOR_S ? time : Math.round(time * 1000 - startedAtMs) / 1000;

function readSegment(value: unknown, startedAtMs: number): NewUtterance | null {
  const segment = object(value);
  const spoken = text(segment?.text)?.trim();
  const start = seconds(segment?.start);
  if (!segment || !spoken || start === undefined) return null;
  const startTime = fromStart(start, startedAtMs);
  const end = seconds(segment.end) ?? seconds(segment.end_time);
  const endTime = end === undefined ? startTime : fromStart(end, startedAtMs);
  const speaker = speakerOf(segment);
  return {
    dedupKey: text(segment.segment_id) ?? `${speaker ?? "unknown"}@${startTime}`,
    speakerId: speaker,
    speakerName: speaker,
    text: spoken,
    startTime,
    endTime: Math.max(endTime, startTime),
  };
}

/** Vexa publishes an empty speaker when it cannot attribute a turn: unknown. */
const speakerOf = (segment: Json) => text(segment.speaker)?.trim() || null;

const utterances = (segments: unknown[], startedAt: string): ProviderEvent[] =>
  segments.flatMap((segment) => {
    const utterance = readSegment(segment, Date.parse(startedAt));
    return utterance ? [{ kind: "utterance" as const, utterance }] : [];
  });

/** Segments a transcript frame confirms, in any of the frame shapes Vexa has used. */
function confirmedSegments(message: Json): unknown[] {
  const payloadSegments = list(object(message.payload)?.segments);
  switch (message.type) {
    case "transcript":
      return list(message.confirmed);
    case "transcript.finalized":
      return payloadSegments;
    case "transcript.mutable":
      return payloadSegments.filter((segment) => object(segment)?.completed === true);
    default:
      return [];
  }
}

/** Draft segments a transcript frame carries: speech still being transcribed. */
function pendingSegments(message: Json): unknown[] {
  switch (message.type) {
    case "transcript":
      return list(message.pending);
    case "transcript.mutable":
      return list(object(message.payload)?.segments).filter((s) => object(s)?.completed !== true);
    default:
      return [];
  }
}

/**
 * Each speaker's words in progress. A `transcript` bundle is one speaker's,
 * so its (possibly empty) `pending` replaces that speaker's draft; other
 * frames only report the speakers they carry drafts for.
 */
function drafts(message: Json): ProviderEvent[] {
  const bySpeaker = new Map<string | null, string[]>();
  if (message.type === "transcript" && typeof message.speaker === "string") {
    bySpeaker.set(message.speaker.trim() || null, []);
  }
  for (const value of pendingSegments(message)) {
    const segment = object(value);
    const spoken = text(segment?.text)?.trim();
    if (!segment || !spoken) continue;
    const speaker = speakerOf(segment);
    bySpeaker.set(speaker, [...(bySpeaker.get(speaker) ?? []), spoken]);
  }
  return [...bySpeaker].map(([speakerName, words]) => ({
    kind: "draft" as const,
    draft: { speakerName, text: words.join(" ") },
  }));
}

/**
 * Reads one frame from Vexa's `/ws` stream. Only confirmed segments become
 * utterances. Drafts (`pending`, `completed: false`) are speech hypotheses:
 * they become `draft` events to show, never utterances to store.
 */
export function readStreamFrame(
  frame: unknown,
  { receivedAt, startedAt }: Reading,
): ProviderEvent[] {
  const message = object(frame);
  if (!message) return [];
  if (message.type !== "meeting.status") {
    return [...utterances(confirmedSegments(message), startedAt), ...drafts(message)];
  }
  const payload = object(message.payload);
  const status = text(payload?.status);
  if (!status) return [];
  const reason = text(payload?.completion_reason) ?? null;
  return [{ kind: "status", report: { status, reason, at: validTime(message.ts) ?? receivedAt } }];
}

// Clocks differ; a record that began this long before the session did is
// an earlier meeting on the same (recurring) Meet code.
const EARLIER_MEETING_MS = 2 * 60_000;

function isEarlierMeeting(record: Json | undefined, startedAt: string): boolean {
  const began = validTime(record?.start_time) ?? validTime(record?.created_at);
  return began !== undefined && Date.parse(began) < Date.parse(startedAt) - EARLIER_MEETING_MS;
}

function terminalReport(record: Json | undefined, receivedAt: string): ProviderEvent[] {
  const status = text(record?.status);
  if (status !== "completed" && status !== "failed") return [];
  const at = validTime(record?.end_time) ?? receivedAt;
  const reason = text(record?.completion_reason) ?? null;
  return [{ kind: "status", report: { status, reason, at } }];
}

/**
 * Reads `GET /transcripts/...`: the confirmed segments, plus the terminal
 * status with its reason (live statuses come from the stream). A record of
 * an earlier meeting on the same code (before `startedAt`) yields nothing.
 */
export function readTranscriptRecord(
  body: unknown,
  { receivedAt, startedAt }: Reading,
): ProviderEvent[] {
  const record = object(body);
  if (isEarlierMeeting(record, startedAt)) return [];
  const confirmed = list(record?.segments).filter((s) => object(s)?.completed !== false);
  return [...utterances(confirmed, startedAt), ...terminalReport(record, receivedAt)];
}

/** Which Vexa meeting a webhook is about: its record id and meeting code. */
export type WebhookTarget = { providerMeetingId: string | null; code: string | null };

function readTarget(meeting: Json): WebhookTarget {
  const id = meeting.id;
  return {
    providerMeetingId: typeof id === "number" || typeof id === "string" ? String(id) : null,
    code: text(meeting.native_meeting_id) ?? null,
  };
}

function readWebhookReport(envelope: Json, meeting: Json): StatusReport | null {
  const change = object(object(envelope.data)?.status_change);
  const status = text(change?.to) ?? text(meeting.status);
  const at = validTime(change?.timestamp) ?? validTime(envelope.created_at);
  if (!status || !at) return null;
  return { status, reason: text(meeting.completion_reason) ?? null, at };
}

/** Reads a verified Vexa webhook envelope (`meeting.status_change`, `bot.failed`, ...). */
export function readWebhook(body: unknown): { target: WebhookTarget; report: StatusReport } | null {
  const envelope = object(body);
  const meeting = object(object(envelope?.data)?.meeting);
  const report = envelope && meeting ? readWebhookReport(envelope, meeting) : null;
  return meeting && report ? { target: readTarget(meeting), report } : null;
}
