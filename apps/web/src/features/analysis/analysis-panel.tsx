import * as stylex from "@stylexjs/stylex";
import type { AnalysisState, CandidateIssue } from "#api/client";
import { Alert, AlertDescription, AlertTitle } from "@ouro/ui/alert";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@ouro/ui/card";
import { Separator } from "@ouro/ui/separator";
import { color, fontSize, fontWeight, space } from "@ouro/ui/tokens.stylex";
import { useState, type ReactNode } from "react";
import { IssueCard } from "./issue-card";
import { RequirementList } from "./requirement-list";
import { useAnalysis, type EvidenceLine } from "./use-analysis";

const styles = stylex.create({
  panel: { display: "flex", flexDirection: "column", gap: space.s5 },
  section: { display: "flex", flexDirection: "column", gap: space.s3 },
  subheading: {
    display: "flex",
    alignItems: "baseline",
    gap: space.s1_5,
    color: color.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  count: { fontWeight: fontWeight.regular, fontVariantNumeric: "tabular-nums" },
  muted: { color: color.mutedForeground, fontSize: fontSize.sm },
  error: { color: color.destructiveForeground, fontSize: fontSize.sm },
  issues: { display: "flex", flexDirection: "column", gap: space.s5 },
  details: { display: "flex", flexDirection: "column", gap: space.s3 },
  summary: { color: color.mutedForeground, fontSize: fontSize.sm, cursor: "pointer" },
});

/** One labelled group of the panel, its heading carrying how many it holds. */
function Group({ label, count, children }: { label: string; count?: number; children: ReactNode }) {
  return (
    <section aria-label={label} {...stylex.props(styles.section)}>
      <h3 {...stylex.props(styles.subheading)}>
        {label}
        {count !== undefined && <span {...stylex.props(styles.count)}>{count}</span>}
      </h3>
      {children}
    </section>
  );
}

type IssueStackProps = {
  issues: CandidateIssue[];
  lines: Map<number, EvidenceLine>;
  onAction: (id: string) => (action: "dismiss" | "save") => void;
};

function IssueStack({ issues, lines, onAction }: IssueStackProps) {
  return (
    <div {...stylex.props(styles.issues)}>
      {issues.map((issue) => (
        <IssueCard key={issue.id} issue={issue} lines={lines} onAction={onAction(issue.id)} />
      ))}
    </div>
  );
}

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
 * The FDE's private side panel, one card: the one gap to ask next, the
 * others still open, the requirements heard so far, and what was closed. Nothing here is shown to, or
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
    <Card render={<aside aria-labelledby="analysis-heading" />}>
      <CardHeader>
        <CardTitle render={<h2 id="analysis-heading" />}>Gaps to clarify</CardTitle>
        {analysis.state?.enabled === false ? (
          <Alert role="note">
            <AlertTitle>Analysis is off</AlertTitle>
            <AlertDescription>
              Set ANTHROPIC_API_KEY on the API to extract requirements and gaps.
            </AlertDescription>
          </Alert>
        ) : (
          <CardDescription render={<output />}>{stateText(analysis.state)}</CardDescription>
        )}
        {failed && (
          <p role="alert" {...stylex.props(styles.error)}>
            That didn't save. Try again.
          </p>
        )}
      </CardHeader>
      <CardPanel xstyle={styles.panel}>
        <Group label="Ask next">
          {next ? (
            <IssueCard issue={next} lines={analysis.lines} prominent onAction={onAction(next.id)} />
          ) : (
            <p {...stylex.props(styles.muted)}>
              No open gaps. Ouro only raises one when an answer would change the implementation.
            </p>
          )}
        </Group>

        {rest.length > 0 && (
          <>
            <Separator />
            <Group label="Also open" count={rest.length}>
              <IssueStack issues={rest} lines={analysis.lines} onAction={onAction} />
            </Group>
          </>
        )}

        <Separator />
        <Group label="Requirements" count={analysis.requirements.length}>
          <RequirementList requirements={analysis.requirements} lines={analysis.lines} />
        </Group>

        {closed.length > 0 && (
          <>
            <Separator />
            <details {...stylex.props(styles.details)}>
              <summary {...stylex.props(styles.summary)}>
                Resolved and dismissed ({closed.length})
              </summary>
              <IssueStack issues={closed} lines={analysis.lines} onAction={onAction} />
            </details>
          </>
        )}
      </CardPanel>
    </Card>
  );
}
