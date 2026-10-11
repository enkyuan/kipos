import {
  apiClient,
  listenToMeeting,
  type AnalysisState,
  type BusinessRequirement,
  type CandidateIssue,
  type TranscriptUtterance,
} from "#api/client";
import { useEffect, useReducer } from "react";

/** What an evidence reference shows: who said it, when, and the words. */
export type EvidenceLine = Pick<TranscriptUtterance, "id" | "speakerName" | "startTime" | "text">;

type Analysis = {
  state: AnalysisState | null;
  requirements: BusinessRequirement[];
  issues: CandidateIssue[];
  lines: Map<number, EvidenceLine>;
};

type Action =
  | { type: "analysis"; state: AnalysisState }
  | { type: "requirement"; requirement: BusinessRequirement }
  | { type: "issue"; issue: CandidateIssue }
  | { type: "line"; line: EvidenceLine };

const upsert = <T extends { id: string }>(list: T[], next: T) =>
  list.some((item) => item.id === next.id)
    ? list.map((item) => (item.id === next.id ? next : item))
    : [...list, next];

function reduce(state: Analysis, action: Action): Analysis {
  switch (action.type) {
    case "analysis":
      return { ...state, state: action.state };
    case "requirement":
      return { ...state, requirements: upsert(state.requirements, action.requirement) };
    case "issue":
      return { ...state, issues: upsert(state.issues, action.issue) };
    case "line":
      return { ...state, lines: new Map(state.lines).set(action.line.id, action.line) };
  }
}

const EMPTY: Analysis = { state: null, requirements: [], issues: [], lines: new Map() };

/**
 * A meeting's requirements and candidate issues, kept current from the
 * live channel (which replays everything persisted on connect, so a
 * refresh shows the same state).
 */
export function useAnalysis(meetingId: string) {
  const [analysis, dispatch] = useReducer(reduce, EMPTY);

  useEffect(
    () =>
      listenToMeeting(meetingId, {
        onEvent: (name, data) => {
          if (name === "analysis") dispatch({ type: "analysis", state: data as AnalysisState });
          if (name === "requirement")
            dispatch({ type: "requirement", requirement: data as BusinessRequirement });
          if (name === "issue") dispatch({ type: "issue", issue: data as CandidateIssue });
          if (name === "utterance") dispatch({ type: "line", line: data as EvidenceLine });
        },
        onConnection: () => {},
      }),
    [meetingId],
  );

  /** Dismisses or saves an issue; the live channel brings back the result. */
  async function act(issueId: string, action: "dismiss" | "save"): Promise<boolean> {
    try {
      const issue = apiClient().api.meetings({ id: meetingId }).issues({ issueId });
      const { data } = await (action === "dismiss" ? issue.dismiss.post() : issue.save.post());
      if (data) dispatch({ type: "issue", issue: data });
      return Boolean(data);
    } catch {
      return false;
    }
  }

  return { analysis, act };
}
