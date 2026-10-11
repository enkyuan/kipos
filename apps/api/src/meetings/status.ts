import type { MeetingStatus } from "./contract";
import type { StatusReport } from "./vexa-events";

// Vexa's live states, as the workspace names them. `stopping` changes
// nothing a person can act on, so it keeps the previous state.
const LIVE: Record<string, MeetingStatus> = {
  requested: "requested",
  joining: "joining",
  awaiting_admission: "waiting_room",
  needs_help: "needs_help",
  active: "recording",
};

// Failures a person can act on, in their words. Any other reason is shown
// as-is so it can be looked up (docs.vexa.ai/troubleshooting/completion-reasons).
const FAILURE_MESSAGES: Record<string, string> = {
  awaiting_admission_rejected: "The host declined to admit the notetaker.",
  awaiting_admission_timeout: "Nobody admitted the notetaker before it gave up waiting.",
  join_failure: "The notetaker could not reach the meeting. Try again.",
  auth_session_missing:
    "This meeting only admits signed-in accounts, which the notetaker doesn't have.",
  validation_error: "Vexa could not use the meeting details. Check the link.",
  evicted: "Someone removed the notetaker from the meeting.",
};

export type DerivedStatus = {
  status: MeetingStatus;
  endedAt: string | null;
  errorMessage: string | null;
};

const byTime = (a: StatusReport, b: StatusReport) => Date.parse(a.at) - Date.parse(b.at);

/**
 * The session status as a function of every report received, so the order
 * reports arrive in cannot change it: any failure wins, then completion,
 * then the latest live state by the provider's own timestamp. Null when no
 * report says anything yet.
 */
export function deriveStatus(reports: StatusReport[]): DerivedStatus | null {
  const ordered = [...reports].sort(byTime);
  const failures = ordered.filter((report) => report.status === "failed");
  if (failures.length > 0) {
    const reason = failures.find((report) => report.reason)?.reason ?? null;
    const message =
      (reason && FAILURE_MESSAGES[reason]) ??
      `The notetaker stopped (${reason ?? "no reason given"}).`;
    return { status: "failed", endedAt: failures[0]!.at, errorMessage: message };
  }
  const completion = ordered.find((report) => report.status === "completed");
  if (completion) return { status: "ended", endedAt: completion.at, errorMessage: null };
  const latest = ordered.findLast((report) => report.status in LIVE);
  return latest ? { status: LIVE[latest.status]!, endedAt: null, errorMessage: null } : null;
}

export const isFinished = (status: MeetingStatus) => status === "ended" || status === "failed";
