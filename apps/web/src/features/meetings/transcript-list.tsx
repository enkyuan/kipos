import * as stylex from "@stylexjs/stylex";
import type { MeetingStatus, TranscriptUtterance } from "#api/client";
import {
  color,
  font,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  space,
  tracking,
} from "@ouro/ui/tokens.stylex";

const styles = stylex.create({
  section: { display: "flex", flexDirection: "column", gap: space.s3 },
  heading: {
    fontFamily: font.heading,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
    letterSpacing: tracking.heading,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: space.s4,
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  line: {
    display: "flex",
    flexDirection: "column",
    gap: space.s1,
    marginInline: `calc(-1 * ${space.s2})`,
    paddingBlock: space.s1,
    paddingInline: space.s2,
    borderRadius: radius.md,
    scrollMarginBlock: space.s24,
    // An evidence link (`#utterance-<id>`) highlights the line it points to.
    backgroundColor: { default: "transparent", ":target": color.brandSurfaceStrong },
  },
  meta: { display: "flex", alignItems: "baseline", gap: space.s2, fontSize: fontSize.sm },
  speaker: { fontWeight: fontWeight.medium },
  unknown: { color: color.mutedForeground, fontStyle: "italic" },
  time: { color: color.mutedForeground, fontFamily: font.mono, fontSize: fontSize.xs },
  text: { lineHeight: lineHeight.relaxed },
  empty: { color: color.mutedForeground, fontSize: fontSize.sm },
});

/** Seconds from the start of the recording as m:ss. */
function offset(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** The speaker-attributed transcript, in spoken order. */
export function TranscriptList({
  utterances,
  status,
}: {
  utterances: TranscriptUtterance[];
  status: MeetingStatus;
}) {
  return (
    <section aria-labelledby="transcript-heading" {...stylex.props(styles.section)}>
      <h2 id="transcript-heading" {...stylex.props(styles.heading)}>
        Transcript
      </h2>
      {utterances.length === 0 && (
        <p {...stylex.props(styles.empty)}>
          {status === "recording"
            ? "Listening. Lines appear here as each speaker finishes a sentence."
            : "Nothing transcribed yet. Lines appear here once the notetaker is recording."}
        </p>
      )}
      {/* role=log: a polite live region that announces new lines as they arrive. */}
      <ol role="log" aria-label="Live transcript" {...stylex.props(styles.list)}>
        {utterances.map((utterance) => (
          // The id is the public anchor other panels link evidence to.
          <li key={utterance.id} id={`utterance-${utterance.id}`} {...stylex.props(styles.line)}>
            <div {...stylex.props(styles.meta)}>
              <span
                {...stylex.props(styles.speaker, utterance.speakerName === null && styles.unknown)}
              >
                {utterance.speakerName ?? "Unknown speaker"}
              </span>
              <time {...stylex.props(styles.time)}>{offset(utterance.startTime)}</time>
            </div>
            <p {...stylex.props(styles.text)}>{utterance.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
