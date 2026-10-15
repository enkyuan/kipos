import * as stylex from "@stylexjs/stylex";
import type { BusinessRequirement } from "#api/client";
import { Badge, type BadgeVariant } from "@kipos/ui/badge";
import { color, fontSize, lineHeight, space } from "@kipos/ui/tokens.stylex";
import { EvidenceLinks } from "./evidence-links";
import type { EvidenceLine } from "./use-analysis";

const styles = stylex.create({
  list: {
    display: "flex",
    flexDirection: "column",
    gap: space.s3,
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  item: { display: "flex", flexDirection: "column", gap: space.s1_5 },
  row: { display: "flex", alignItems: "flex-start", gap: space.s2 },
  text: { flexGrow: 1, fontSize: fontSize.sm, lineHeight: lineHeight.sm },
  superseded: { color: color.mutedForeground, textDecorationLine: "line-through" },
  empty: { color: color.mutedForeground, fontSize: fontSize.sm },
});

const STATUS: Record<BusinessRequirement["status"], { label: string; variant: BadgeVariant }> = {
  proposed: { label: "Proposed", variant: "outline" },
  confirmed: { label: "Confirmed", variant: "success" },
  superseded: { label: "Superseded", variant: "secondary" },
};

/**
 * Requirements heard in the meeting. "Proposed" is what was said;
 * "Confirmed" only where a participant explicitly confirmed it.
 */
export function RequirementList({
  requirements,
  lines,
}: {
  requirements: BusinessRequirement[];
  lines: Map<number, EvidenceLine>;
}) {
  if (requirements.length === 0) {
    return <p {...stylex.props(styles.empty)}>No requirements heard yet.</p>;
  }
  return (
    <ul {...stylex.props(styles.list)}>
      {requirements.map((requirement) => (
        <li key={requirement.id} {...stylex.props(styles.item)}>
          <div {...stylex.props(styles.row)}>
            <span
              {...stylex.props(
                styles.text,
                requirement.status === "superseded" && styles.superseded,
              )}
            >
              {requirement.description}
            </span>
            <Badge variant={STATUS[requirement.status].variant}>
              {STATUS[requirement.status].label}
            </Badge>
          </div>
          <EvidenceLinks label="Said in" ids={requirement.evidenceUtteranceIds} lines={lines} />
          <EvidenceLinks
            label="Confirmed in"
            ids={requirement.confirmationUtteranceIds}
            lines={lines}
          />
        </li>
      ))}
    </ul>
  );
}
