import * as stylex from "@stylexjs/stylex";
import type { CandidateIssue } from "#api/client";
import { Badge, type BadgeVariant } from "@kipos/ui/badge";
import { Button } from "@kipos/ui/button";
import { color, fontSize, fontWeight, lineHeight, radius, space } from "@kipos/ui/tokens.stylex";
import { EvidenceLinks } from "./evidence-links";
import type { EvidenceLine } from "./use-analysis";

const styles = stylex.create({
  card: { display: "flex", flexDirection: "column", gap: space.s2_5 },
  // The one to ask next stands out on a brand surface; the rest sit flat in
  // the panel, divided by its spacing.
  prominent: {
    gap: space.s3,
    padding: space.s4,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: `color-mix(in srgb, ${color.brand} 48%, transparent)`,
    borderRadius: radius.xl,
    backgroundColor: color.brandSurface,
  },
  badges: { display: "flex", flexWrap: "wrap", gap: space.s1 },
  eyebrowRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.s2,
  },
  eyebrow: {
    color: color.brandText,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.sm,
    textWrap: "balance",
  },
  head: { display: "flex", flexDirection: "column", gap: space.s1 },
  // The lead issue's headline is the question itself: what the FDE says next.
  leadQuestion: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.sm,
    textWrap: "balance",
  },
  context: {
    color: color.mutedForeground,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    textWrap: "pretty",
  },
  label: { color: color.mutedForeground, fontSize: fontSize.xs },
  impact: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, textWrap: "pretty" },
  question: {
    margin: 0,
    paddingInlineStart: space.s3,
    borderInlineStartWidth: 2,
    borderInlineStartStyle: "solid",
    borderInlineStartColor: color.brand,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.sm,
    textWrap: "pretty",
  },
  actions: { display: "flex", gap: space.s2 },
});

const PRIORITY: Record<CandidateIssue["priority"], BadgeVariant> = {
  high: "error",
  medium: "warning",
  low: "secondary",
};

const TYPE_LABEL: Record<CandidateIssue["type"], string> = {
  missing_business_rule: "Missing business rule",
  ambiguous_requirement: "Ambiguous requirement",
  conflicting_requirement: "Conflicting requirement",
  missing_integration_detail: "Missing integration detail",
  unresolved_ownership: "Unresolved ownership",
  external_dependency: "External dependency",
};

const PRIORITY_LABEL: Record<CandidateIssue["priority"], string> = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
};

const STATUS: Record<CandidateIssue["status"], { label: string; variant: BadgeVariant }> = {
  open: { label: "Open", variant: "outline" },
  dismissed: { label: "Dismissed", variant: "secondary" },
  resolved: { label: "Resolved", variant: "success" },
};

type IssueCardProps = {
  issue: CandidateIssue;
  lines: Map<number, EvidenceLine>;
  /** Set for the panel's lead issue: it stands out, under this label. */
  eyebrow?: string;
  onAction: (action: "dismiss" | "save") => void;
};

/** Priority, then what a reader of a list needs: status once closed, saved, type. */
function IssueBadges({ issue, eyebrow }: { issue: CandidateIssue; eyebrow?: string }) {
  const priority = (
    <Badge variant={PRIORITY[issue.priority]}>{PRIORITY_LABEL[issue.priority]}</Badge>
  );
  if (eyebrow) {
    return (
      <div {...stylex.props(styles.eyebrowRow)}>
        <span {...stylex.props(styles.eyebrow)}>{eyebrow}</span>
        {priority}
      </div>
    );
  }
  return (
    <div {...stylex.props(styles.badges)}>
      {priority}
      {issue.status !== "open" && (
        <Badge variant={STATUS[issue.status].variant}>{STATUS[issue.status].label}</Badge>
      )}
      {issue.savedAt && <Badge variant="info">Saved</Badge>}
      <Badge variant="secondary">{TYPE_LABEL[issue.type]}</Badge>
    </div>
  );
}

/** One candidate issue: what is missing, why it matters, what to ask, and where it came from. */
export function IssueCard({ issue, lines, eyebrow, onAction }: IssueCardProps) {
  const prominent = eyebrow !== undefined;
  const headingId = `issue-${issue.id}`;
  return (
    <article
      aria-labelledby={headingId}
      {...stylex.props(styles.card, prominent && styles.prominent)}
    >
      <IssueBadges issue={issue} eyebrow={eyebrow} />
      {prominent ? (
        <div {...stylex.props(styles.head)}>
          <h3 id={headingId} {...stylex.props(styles.leadQuestion)}>
            {issue.suggestedQuestion}
          </h3>
          <p {...stylex.props(styles.context)}>
            {issue.suggestedOwner && `Ask ${issue.suggestedOwner} · `}
            {issue.summary}
          </p>
        </div>
      ) : (
        <h3 id={headingId} {...stylex.props(styles.title)}>
          {issue.summary}
        </h3>
      )}
      <div>
        <span {...stylex.props(styles.label)}>Why it matters</span>
        <p {...stylex.props(styles.impact)}>{issue.implementationImpact}</p>
      </div>
      {!prominent && (
        <div>
          <span {...stylex.props(styles.label)}>
            Ask{issue.suggestedOwner ? ` ${issue.suggestedOwner}` : ""}
          </span>
          <blockquote {...stylex.props(styles.question)}>{issue.suggestedQuestion}</blockquote>
        </div>
      )}
      <EvidenceLinks label="Raised by" ids={issue.evidenceUtteranceIds} lines={lines} />
      <EvidenceLinks label="Answered by" ids={issue.resolutionUtteranceIds} lines={lines} />
      {issue.status === "open" && (
        <div {...stylex.props(styles.actions)}>
          <Button
            size="sm"
            variant="outline"
            disabled={issue.savedAt !== null}
            onClick={() => onAction("save")}
          >
            {issue.savedAt ? "Question saved" : "Save question"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onAction("dismiss")}>
            Dismiss
          </Button>
        </div>
      )}
    </article>
  );
}
