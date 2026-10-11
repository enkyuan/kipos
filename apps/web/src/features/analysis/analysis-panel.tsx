import * as stylex from "@stylexjs/stylex";
import type { CandidateIssue } from "#api/client";
import { Alert, AlertDescription, AlertTitle } from "@ouro/ui/alert";
import { Badge } from "@ouro/ui/badge";
import { Card, CardHeader, CardPanel, CardTitle } from "@ouro/ui/card";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@ouro/ui/collapsible";
import {
  color,
  fontSize,
  fontWeight,
  lineHeight,
  media,
  motion as timing,
  radius,
  space,
} from "@ouro/ui/tokens.stylex";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { IssueCard } from "./issue-card";
import { LiveStatus } from "./live-status";
import { RequirementList } from "./requirement-list";
import { useAnalysis, type EvidenceLine } from "./use-analysis";

const styles = stylex.create({
  titleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.s3,
  },
  panel: { display: "flex", flexDirection: "column", gap: space.s4 },
  error: { color: color.destructiveForeground, fontSize: fontSize.sm },
  // Nothing to ask: a dashed outline, so the empty state never reads as content.
  empty: {
    display: "flex",
    flexDirection: "column",
    gap: space.s1,
    padding: space.s4,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: color.input,
    borderRadius: radius.xl,
  },
  emptyTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  emptyText: { color: color.mutedForeground, fontSize: fontSize.xs, lineHeight: lineHeight.xs },
  groups: {
    display: "flex",
    flexDirection: "column",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.border,
  },
  group: {
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.border,
  },
  trigger: {
    display: "flex",
    alignItems: "center",
    gap: space.s2,
    width: "100%",
    minHeight: "2.75rem",
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    fontFamily: "inherit",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: "start",
    cursor: "pointer",
    outline: "none",
    color: {
      default: color.foreground,
      ":hover": { default: null, [media.hover]: color.brandText },
    },
    textDecorationLine: { default: null, ":focus-visible": "underline" },
    textUnderlineOffset: "4px",
    transitionProperty: "color",
    transitionDuration: timing.fast,
  },
  chevron: {
    width: "0.875rem",
    height: "0.875rem",
    flexShrink: 0,
    color: color.mutedForeground,
    transitionProperty: "rotate",
    transitionDuration: { default: timing.fast, [media.reducedMotion]: "0s" },
    transitionTimingFunction: timing.easeOut,
  },
  chevronOpen: { rotate: "90deg" },
  count: { marginInlineStart: "auto", fontVariantNumeric: "tabular-nums" },
  // Indented past the chevron, so items line up under their row's label.
  groupBody: {
    display: "flex",
    flexDirection: "column",
    gap: space.s5,
    paddingBottom: space.s4,
    paddingInlineStart: `calc(0.875rem + ${space.s2})`,
  },
});

// Presence animation (ADR 0005): the lead question leaves fast and the
// next one settles in, so a new gap is noticed without the panel jumping.
// Reduced motion keeps only the fade.
const settle = { type: "spring", duration: 0.3, bounce: 0 } as const;
const leadIn = { opacity: 1, transform: "translateY(0px)", filter: "blur(0px)" };
const leadFrom = { opacity: 0, transform: "translateY(4px)", filter: "blur(4px)" };
const leadOut = { opacity: 0, filter: "blur(4px)", transition: { duration: 0.12 } };

/** A collapsible row: label and count, its items underneath when opened. */
function Group({ label, count, children }: { label: string; count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} xstyle={styles.group}>
      <CollapsibleTrigger xstyle={styles.trigger}>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...stylex.props(styles.chevron, open && styles.chevronOpen)}
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
        {label}
        <Badge variant="secondary" xstyle={styles.count}>
          {count}
        </Badge>
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <div {...stylex.props(styles.groupBody)}>{children}</div>
      </CollapsiblePanel>
    </Collapsible>
  );
}

type IssueListProps = {
  issues: CandidateIssue[];
  lines: Map<number, EvidenceLine>;
  onAction: (id: string) => (action: "dismiss" | "save") => void;
};

function IssueList({ issues, lines, onAction }: IssueListProps) {
  return issues.map((issue) => (
    <IssueCard key={issue.id} issue={issue} lines={lines} onAction={onAction(issue.id)} />
  ));
}

function NothingToAsk() {
  return (
    <div {...stylex.props(styles.empty)}>
      <p {...stylex.props(styles.emptyTitle)}>Nothing to ask yet</p>
      <p {...stylex.props(styles.emptyText)}>
        A gap appears when an answer would change what gets built.
      </p>
    </div>
  );
}

const RANK = { high: 0, medium: 1, low: 2 } as const;

/** Highest priority first; within a priority, the most recently raised first. */
const byPriority = (a: CandidateIssue, b: CandidateIssue) =>
  RANK[a.priority] - RANK[b.priority] || b.createdAt.localeCompare(a.createdAt);

/**
 * The FDE's private side panel, question first: the one gap to ask next,
 * then the other open gaps, the requirements heard so far, and what was
 * closed, each folded away. Nothing here is shown to, or sent to, the meeting.
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
  const lines = analysis.lines;

  return (
    <MotionConfig reducedMotion="user">
      <Card render={<aside aria-labelledby="analysis-heading" />}>
        <CardHeader>
          <div {...stylex.props(styles.titleRow)}>
            <CardTitle render={<h2 id="analysis-heading" />}>Gaps to clarify</CardTitle>
            <LiveStatus state={analysis.state} />
          </div>
          {analysis.state?.enabled === false && (
            <Alert role="note">
              <AlertTitle>Analysis is off</AlertTitle>
              <AlertDescription>
                Add Amazon Bedrock credentials to the API to extract requirements and gaps.
              </AlertDescription>
            </Alert>
          )}
          {failed && (
            <p role="alert" {...stylex.props(styles.error)}>
              That didn't save. Try again.
            </p>
          )}
        </CardHeader>
        <CardPanel xstyle={styles.panel}>
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={next?.id ?? "nothing"}
              initial={leadFrom}
              animate={leadIn}
              exit={leadOut}
              transition={settle}
            >
              {next ? (
                <IssueCard
                  issue={next}
                  lines={lines}
                  eyebrow="Ask next"
                  onAction={onAction(next.id)}
                />
              ) : (
                <NothingToAsk />
              )}
            </motion.div>
          </AnimatePresence>
          <div {...stylex.props(styles.groups)}>
            {rest.length > 0 && (
              <Group label="Also open" count={rest.length}>
                <IssueList issues={rest} lines={lines} onAction={onAction} />
              </Group>
            )}
            <Group label="Requirements" count={analysis.requirements.length}>
              <RequirementList requirements={analysis.requirements} lines={lines} />
            </Group>
            {closed.length > 0 && (
              <Group label="Resolved and dismissed" count={closed.length}>
                <IssueList issues={closed} lines={lines} onAction={onAction} />
              </Group>
            )}
          </div>
        </CardPanel>
      </Card>
    </MotionConfig>
  );
}
