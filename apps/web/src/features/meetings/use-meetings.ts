import { apiClient, type MeetingSession } from "#api/client";
import { useEffect, useState } from "react";

export type MeetingsState =
  | { kind: "loading" | "unavailable" }
  | { kind: "ready"; meetings: MeetingSession[] };

async function load(): Promise<MeetingsState> {
  try {
    const { data } = await apiClient().api.meetings.get();
    if (data) return { kind: "ready", meetings: data };
  } catch {
    // Network failure: same as a server error to the person.
  }
  return { kind: "unavailable" };
}

/** Every shadowed meeting, newest first, loaded once in the browser. */
export function useMeetings(): MeetingsState {
  const [state, setState] = useState<MeetingsState>({ kind: "loading" });
  useEffect(() => {
    let cancelled = false;
    void load().then((next) => cancelled || setState(next));
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}
