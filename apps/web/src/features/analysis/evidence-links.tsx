import * as stylex from "@stylexjs/stylex";
import { color, font, fontSize, lineHeight, radius, space } from "@kipos/ui/tokens.stylex";
import type { EvidenceLine } from "./use-analysis";

const styles = stylex.create({
  list: {
    display: "flex",
    flexDirection: "column",
    gap: space.s1,
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  label: { color: color.mutedForeground, fontSize: fontSize.xs },
  link: {
    display: "block",
    paddingBlock: space.s1,
    paddingInline: space.s2,
    borderRadius: radius.md,
    backgroundColor: { default: color.muted, ":hover": color.accent },
    color: color.foreground,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    textDecoration: "none",
  },
  time: { color: color.mutedForeground, fontFamily: font.mono },
});

const clock = (seconds: number) => {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

const excerpt = (text: string) => (text.length > 90 ? `${text.slice(0, 90)}…` : text);

/**
 * Links to the transcript lines a record rests on. Each opens the line in
 * the transcript (its `#utterance-<id>` anchor), which highlights it.
 */
export function EvidenceLinks({
  label,
  ids,
  lines,
}: {
  label: string;
  ids: number[];
  lines: Map<number, EvidenceLine>;
}) {
  if (ids.length === 0) return null;
  return (
    <div>
      <span {...stylex.props(styles.label)}>{label}</span>
      <ul {...stylex.props(styles.list)}>
        {ids.map((id) => {
          const line = lines.get(id);
          return (
            <li key={id}>
              <a href={`#utterance-${id}`} {...stylex.props(styles.link)}>
                {line ? (
                  <>
                    <span {...stylex.props(styles.time)}>{clock(line.startTime)}</span>{" "}
                    {line.speakerName ?? "Unknown speaker"}: “{excerpt(line.text)}”
                  </>
                ) : (
                  `Transcript line ${id}`
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
