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

function readSegment(value: unknown): NewUtterance | null {
  const segment = object(value);
  const spoken = text(segment?.text)?.trim();
  const startTime = seconds(segment?.start);
  if (!segment || !spoken || startTime === undefined) return null;
  const endTime = seconds(segment.end) ?? seconds(segment.end_time) ?? startTime;
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

const utterances = (segments: unknown[]): ProviderEvent[] =>
  segments.flatMap((segment) => {
    const utterance = readSegment(segment);
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

/**
 * Reads one frame from Vexa's `/ws` stream. Only confirmed segments become
 * utterances: drafts (`pending`, `completed: false`) are speech hypotheses
 * and are always ignored.
 */
export function readStreamFrame(frame: unknown, receivedAt: string): ProviderEvent[] {
  const message = object(frame);
  if (!message) return [];
  if (message.type !== "meeting.status") return utterances(confirmedSegments(message));
  const payload = object(message.payload);
  const status = text(payload?.status);
  if (!status) return [];
  const reason = text(payload?.completion_reason) ?? null;
  return [{ kind: "status", report: { status, reason, at: validTime(message.ts) ?? receivedAt } }];
}

// Clocks differ; a record that began this long before the session did is
// an earlier meeting on the same (recurring) Meet code.
const EARLIER_MEETING_MS = 2 * 60_000;

function isEarlierMeeting(record: Json | undefined, notBefore: string): boolean {
  const began = validTime(record?.start_time) ?? validTime(record?.created_at);
  return began !== undefined && Date.parse(began) < Date.parse(notBefore) - EARLIER_MEETING_MS;
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
 * an earlier meeting on the same code (before `notBefore`) yields nothing.
 */
export function readTranscriptRecord(
  body: unknown,
  { receivedAt, notBefore }: { receivedAt: string; notBefore: string },
): ProviderEvent[] {
  const record = object(body);
  if (isEarlierMeeting(record, notBefore)) return [];
  const confirmed = list(record?.segments).filter((s) => object(s)?.completed !== false);
  return [...utterances(confirmed), ...terminalReport(record, receivedAt)];
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
