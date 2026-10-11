import * as stylex from "@stylexjs/stylex";
import type { AnalysisState, CandidateIssue } from "#api/client";
import { Alert, AlertDescription, AlertTitle } from "@ouro/ui/alert";
import { color, font, fontSize, fontWeight, space, tracking } from "@ouro/ui/tokens.stylex";
import { useState } from "react";
import { IssueCard } from "./issue-card";
import { RequirementList } from "./requirement-list";
import { useAnalysis } from "./use-analysis";

const styles = stylex.create({
  panel: { display: "flex", flexDirection: "column", gap: space.s5 },
  section: { display: "flex", flexDirection: "column", gap: space.s2_5 },
  heading: {
    fontFamily: font.heading,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
    letterSpacing: tracking.heading,
  },
  subheading: {
    color: color.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  muted: { color: color.mutedForeground, fontSize: fontSize.sm },
  error: { color: color.destructiveForeground, fontSize: fontSize.sm },
  details: { display: "flex", flexDirection: "column", gap: space.s2_5 },
  summary: { color: color.mutedForeground, fontSize: fontSize.sm, cursor: "pointer" },
});

const RANK = { high: 0, medium: 1, low: 2 } as const;

/** Highest priority first; within a priority, the most recently raised first. */
const byPriority = (a: CandidateIssue, b: CandidateIssue) =>
  RANK[a.priority] - RANK[b.priority] || b.createdAt.localeCompare(a.createdAt);

function stateText(state: AnalysisState | null): string {
  if (!state) return "Connecting…";
  if (state.state === "analyzing") return "Analyzing the latest conversation…";
  if (state.state === "failed")
    return "The last analysis failed; the next one will retry. The transcript is unaffected.";
  return state.analyzedAt
    ? `Updated ${new Date(state.analyzedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
    : "Waiting for about 25 seconds of conversation.";
}

/**
 * The FDE's private side panel: gaps worth asking about, the one to ask
 * next, and the requirements heard so far. Nothing here is shown to, or
 * sent to, the meeting.
 */
export function AnalysisPanel({ meetingId }: { meetingId: string }) {
  const { analysis, act } = useAnalysis(meetingId);
  const [failed, setFailed] = useState(false);
  const open = analysis.issues.filter((issue) => issue.status === "open").sort(byPriority);
  const [next] = open.filter((issue) => issue.savedAt === null);
  const rest = open.filter((issue) => issue !== next);
  const closed = analysis.issues.filter((issue) => issue.status !== "open").sort(byPriority);
  const onAction = (id: string) => async (action: "dismiss" | "save") =>
    setFailed(!(await act(id, action)));

  return (
    <aside aria-labelledby="analysis-heading" {...stylex.props(styles.panel)}>
      <div {...stylex.props(styles.section)}>
        <h2 id="analysis-heading" {...stylex.props(styles.heading)}>
          Gaps to clarify
        </h2>
        {analysis.state?.enabled === false ? (
          <Alert role="note">
            <AlertTitle>Analysis is off</AlertTitle>
            <AlertDescription>
              Set ANTHROPIC_API_KEY on the API to extract requirements and gaps.
            </AlertDescription>
          </Alert>
        ) : (
          <output {...stylex.props(styles.muted)}>{stateText(analysis.state)}</output>
        )}
        {failed && (
          <p role="alert" {...stylex.props(styles.error)}>
            That didn't save. Try again.
          </p>
        )}
      </div>

      <section aria-label="Ask next" {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.subheading)}>Ask next</h3>
        {next ? (
          <IssueCard issue={next} lines={analysis.lines} prominent onAction={onAction(next.id)} />
        ) : (
          <p {...stylex.props(styles.muted)}>
            No open gaps. Ouro only raises one when an answer would change the implementation.
          </p>
        )}
      </section>

      {rest.length > 0 && (
        <section aria-label="Other open gaps" {...stylex.props(styles.section)}>
          <h3 {...stylex.props(styles.subheading)}>Also open</h3>
          {rest.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              lines={analysis.lines}
              onAction={onAction(issue.id)}
            />
          ))}
        </section>
      )}

      <section aria-label="Requirements" {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.subheading)}>Requirements</h3>
        <RequirementList requirements={analysis.requirements} lines={analysis.lines} />
      </section>

      {closed.length > 0 && (
        <details {...stylex.props(styles.details)}>
          <summary {...stylex.props(styles.summary)}>
            Resolved and dismissed ({closed.length})
          </summary>
          {closed.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              lines={analysis.lines}
              onAction={onAction(issue.id)}
            />
          ))}
        </details>
      )}
    </aside>
  );
}
