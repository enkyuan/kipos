import {
  apiClient,
  listenToMeeting,
  type Connection,
  type DraftSpeech,
  type MeetingSession,
  type TranscriptUtterance,
} from "#api/client";
import { useEffect, useReducer } from "react";

export type { Connection };

export type MeetingState =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "unavailable" }
  | {
      kind: "ready";
      session: MeetingSession;
      utterances: TranscriptUtterance[];
      /** Words still being spoken, one entry per speaker, in the order they started. */
      drafts: DraftSpeech[];
      connection: Connection;
    };

type Action =
  | { type: "loaded"; session: MeetingSession; utterances: TranscriptUtterance[] }
  | { type: "missing" | "unavailable" }
  | { type: "session"; session: MeetingSession }
  | { type: "utterance"; utterance: TranscriptUtterance }
  | { type: "draft"; draft: DraftSpeech }
  | { type: "connection"; connection: Connection };

/** Spoken order: by start time, then arrival. Replays (same id) replace, never duplicate. */
function merge(list: TranscriptUtterance[], next: TranscriptUtterance): TranscriptUtterance[] {
  const others = list.filter((utterance) => utterance.id !== next.id);
  return [...others, next].sort((a, b) => a.startTime - b.startTime || a.id - b.id);
}

/** A speaker's new draft replaces their last in place; an empty one clears it. */
function withDraft(drafts: DraftSpeech[], next: DraftSpeech): DraftSpeech[] {
  const same = (draft: DraftSpeech) => draft.speakerName === next.speakerName;
  if (!next.text) return drafts.filter((draft) => !same(draft));
  return drafts.some(same)
    ? drafts.map((draft) => (same(draft) ? next : draft))
    : [...drafts, next];
}

function reduce(state: MeetingState, action: Action): MeetingState {
  switch (action.type) {
    case "loaded":
      return {
        kind: "ready",
        session: action.session,
        utterances: action.utterances,
        drafts: [],
        connection: "connecting",
      };
    case "missing":
    case "unavailable":
      return { kind: action.type };
  }
  if (state.kind !== "ready") return state;
  switch (action.type) {
    case "session":
      return { ...state, session: action.session };
    case "utterance":
      // A confirmed line supersedes its speaker's draft; the provider's
      // next frame carries whatever that speaker says after it.
      return {
        ...state,
        utterances: merge(state.utterances, action.utterance),
        drafts: state.drafts.filter((d) => d.speakerName !== action.utterance.speakerName),
      };
    case "draft":
      return { ...state, drafts: withDraft(state.drafts, action.draft) };
    case "connection":
      return { ...state, connection: action.connection };
  }
}

async function load(meetingId: string): Promise<Action> {
  try {
    const meeting = apiClient().api.meetings({ id: meetingId });
    const [session, transcript] = await Promise.all([meeting.get(), meeting.transcript.get()]);
    if (session.error?.status === 404) return { type: "missing" };
    if (session.data && transcript.data) {
      return { type: "loaded", session: session.data, utterances: transcript.data };
    }
  } catch {
    // Network failure: same as a server error to the person.
  }
  return { type: "unavailable" };
}

/**
 * One meeting session as the person should see it: persisted state first,
 * then live changes from the server as the provider reports them.
 */
export function useMeeting(meetingId: string): MeetingState {
  const [state, dispatch] = useReducer(reduce, { kind: "loading" });

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    void load(meetingId).then((action) => {
      if (cancelled) return;
      dispatch(action);
      if (action.type !== "loaded") return;
      stop = listenToMeeting(meetingId, {
        onEvent: (name, data) => {
          if (name === "session") dispatch({ type: "session", session: data as MeetingSession });
          if (name === "utterance")
            dispatch({ type: "utterance", utterance: data as TranscriptUtterance });
          if (name === "draft") dispatch({ type: "draft", draft: data as DraftSpeech });
        },
        onConnection: (connection) => dispatch({ type: "connection", connection }),
      });
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [meetingId]);

  return state;
}
