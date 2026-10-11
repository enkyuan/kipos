import { apiClient } from "#api/client";

export type StartOutcome =
  | { kind: "started"; meetingId: string }
  | { kind: "invalid"; field: "meetingUrl" | "authorized"; message: string }
  | { kind: "unavailable"; message: string };

/**
 * Asks the API to send the notetaker to `meetingUrl` and says what the
 * person should see. A notetaker the provider refuses is still "started":
 * its session exists and shows the failure.
 */
export async function startShadowing(
  meetingUrl: string,
  authorized: boolean,
): Promise<StartOutcome> {
  try {
    const { data, error } = await apiClient().api.meetings.post({ meetingUrl, authorized });
    if (data) return { kind: "started", meetingId: data.id };
    if (error.status === 422) {
      const { code, message } = error.value.error;
      return {
        kind: "invalid",
        field: code === "authorization_required" ? "authorized" : "meetingUrl",
        message,
      };
    }
  } catch {
    // A network failure lands here; it reads the same as a 5xx to the person.
  }
  return {
    kind: "unavailable",
    message: "Couldn't reach the Superpower server. Try again in a moment.",
  };
}
