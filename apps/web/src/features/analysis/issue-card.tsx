import * as stylex from "@stylexjs/stylex";
import type { CandidateIssue } from "#api/client";
import { Badge, type BadgeVariant } from "@ouro/ui/badge";
import { Button } from "@ouro/ui/button";
import { color, fontSize, fontWeight, lineHeight, radius, space } from "@ouro/ui/tokens.stylex";
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
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.sm,
    textWrap: "balance",
  },
  prominentTitle: { fontSize: fontSize.base },
  label: { color: color.mutedForeground, fontSize: fontSize.xs },
  impact: { fontSize: fontSize.sm, lineHeight: lineHeight.sm },
  question: {
    margin: 0,
    paddingInlineStart: space.s3,
    borderInlineStartWidth: 2,
    borderInlineStartStyle: "solid",
    borderInlineStartColor: color.brand,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.sm,
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

const STATUS: Record<CandidateIssue["status"], { label: string; variant: BadgeVariant }> = {
  open: { label: "Open", variant: "outline" },
  dismissed: { label: "Dismissed", variant: "secondary" },
  resolved: { label: "Resolved", variant: "success" },
};

type IssueCardProps = {
  issue: CandidateIssue;
  lines: Map<number, EvidenceLine>;
  prominent?: boolean;
  onAction: (action: "dismiss" | "save") => void;
};

/** One candidate issue: what is missing, why it matters, what to ask, and where it came from. */
export function IssueCard({ issue, lines, prominent = false, onAction }: IssueCardProps) {
  const headingId = `issue-${issue.id}`;
  return (
    <article
      aria-labelledby={headingId}
      {...stylex.props(styles.card, prominent && styles.prominent)}
    >
      <div {...stylex.props(styles.badges)}>
        <Badge variant={PRIORITY[issue.priority]}>{issue.priority} priority</Badge>
        <Badge variant={STATUS[issue.status].variant}>{STATUS[issue.status].label}</Badge>
        {issue.savedAt && <Badge variant="info">Saved</Badge>}
        <Badge variant="secondary">{TYPE_LABEL[issue.type]}</Badge>
      </div>
      <h3 id={headingId} {...stylex.props(styles.title, prominent && styles.prominentTitle)}>
        {issue.summary}
      </h3>
      <div>
        <span {...stylex.props(styles.label)}>Why it matters</span>
        <p {...stylex.props(styles.impact)}>{issue.implementationImpact}</p>
      </div>
      <div>
        <span {...stylex.props(styles.label)}>
          Ask{issue.suggestedOwner ? ` ${issue.suggestedOwner}` : ""}
        </span>
        <blockquote {...stylex.props(styles.question)}>{issue.suggestedQuestion}</blockquote>
      </div>
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
