import { treaty } from "@elysiajs/eden";
import type { App } from "@kipos/api";

export type {
  AnalysisState,
  BusinessRequirement,
  CandidateIssue,
  DraftSpeech,
  MeetingSession,
  MeetingStatus,
  TranscriptUtterance,
} from "@kipos/api";

/**
 * The typed boundary to apps/api. Routes, bodies and responses come from
 * the API's own types, so a contract change fails `bun run typecheck` here.
 *
 * Browser only: requests go to this origin's /api, which the dev server
 * (and the production proxy) forwards to apps/api.
 */
export function apiClient() {
  return treaty<App>(window.location.origin);
}

/**
 * Event names on a meeting's live channel and their JSON payloads:
 * `session` (MeetingSession), `utterance` (TranscriptUtterance),
 * `draft` (DraftSpeech: live only, never replayed), `analysis`
 * (AnalysisState), `requirement` (BusinessRequirement), `issue`
 * (CandidateIssue).
 */
const MEETING_EVENTS = [
  "session",
  "utterance",
  "draft",
  "analysis",
  "requirement",
  "issue",
] as const;
type MeetingEventName = (typeof MEETING_EVENTS)[number];

export type Connection = "connecting" | "live" | "reconnecting";

type Listener = {
  onEvent: (name: MeetingEventName, data: unknown) => void;
  onConnection: (connection: Connection) => void;
};

/**
 * Subscribes to a meeting's live channel (Server-Sent Events). The server
 * replays persisted state on every (re)connect, so consumers merge by id.
 * Returns the unsubscribe function.
 */
export function listenToMeeting(
  meetingId: string,
  { onEvent, onConnection }: Listener,
): () => void {
  let source: EventSource | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let closed = false;
  let attempt = 0;
  const open = () => {
    source = new EventSource(`/api/meetings/${encodeURIComponent(meetingId)}/events`);
    for (const name of MEETING_EVENTS) {
      source.addEventListener(name, (event) => onEvent(name, JSON.parse(event.data)));
    }
    source.addEventListener("open", () => {
      attempt = 0;
      onConnection("live");
    });
    source.addEventListener("error", () => {
      onConnection("reconnecting");
      // EventSource retries a dropped connection itself, but gives up for
      // good on an error response (a proxy 502 during an API restart).
      if (closed || source?.readyState !== EventSource.CLOSED) return;
      retry = setTimeout(open, Math.min(1000 * 2 ** attempt++, 30_000));
    });
  };
  onConnection("connecting");
  open();
  return () => {
    closed = true;
    clearTimeout(retry);
    source?.close();
  };
}
