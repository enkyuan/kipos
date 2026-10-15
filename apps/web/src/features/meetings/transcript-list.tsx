import * as stylex from "@stylexjs/stylex";
import type { DraftSpeech, MeetingStatus, TranscriptUtterance } from "#api/client";
import {
  color,
  font,
  fontSize,
  fontWeight,
  lineHeight,
  media,
  motion,
  radius,
  space,
  tracking,
} from "@kipos/ui/tokens.stylex";
import { useEffect, useRef } from "react";

const pulse = stylex.keyframes({ "50%": { opacity: 0.3 } });

const styles = stylex.create({
  section: { display: "flex", flexDirection: "column", gap: space.s3 },
  stream: { display: "flex", flexDirection: "column", gap: space.s4 },
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
  time: {
    color: color.mutedForeground,
    fontFamily: font.mono,
    fontSize: fontSize.xs,
    fontVariantNumeric: "tabular-nums",
  },
  text: { lineHeight: lineHeight.relaxed, textWrap: "pretty" },
  draftText: { color: color.mutedForeground },
  speaking: {
    display: "inline-flex",
    alignItems: "center",
    gap: space.s1_5,
    color: color.mutedForeground,
    fontSize: fontSize.xs,
  },
  dot: {
    width: "0.375rem",
    height: "0.375rem",
    borderRadius: radius.full,
    backgroundColor: color.success,
    animationName: pulse,
    animationDuration: { default: "1.6s", [media.reducedMotion]: "0s" },
    animationIterationCount: "infinite",
    animationTimingFunction: motion.ease,
  },
  empty: { color: color.mutedForeground, fontSize: fontSize.sm },
});

/** Seconds from the start of the recording as m:ss. */
function offset(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

// Within this distance of the page bottom, the person is reading live.
const LIVE_EDGE_PX = 96;

const atLiveEdge = () =>
  window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - LIVE_EDGE_PX;

/**
 * Keeps a person who is reading at the bottom of the page there as the
 * transcript grows. Anyone who scrolled up (or followed an evidence link)
 * stays put. Returns the ref for the growing element.
 */
function useFollowLiveEdge(live: boolean) {
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = content.current;
    if (!live || !element) return;
    let following = atLiveEdge();
    const onScroll = () => void (following = atLiveEdge());
    // Instant: drafts change several times a second, and smooth scrolls would pile up.
    const observer = new ResizeObserver(() => {
      if (following)
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    observer.observe(element);
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [live]);
  return content;
}

/**
 * The speaker-attributed transcript, in spoken order, followed by the words
 * each speaker is saying right now (drafts the provider has not confirmed).
 */
export function TranscriptList({
  utterances,
  drafts,
  status,
}: {
  utterances: TranscriptUtterance[];
  drafts: DraftSpeech[];
  status: MeetingStatus;
}) {
  const live = status === "recording";
  const speaking = live ? drafts : [];
  const content = useFollowLiveEdge(live);
  return (
    <section aria-labelledby="transcript-heading" {...stylex.props(styles.section)}>
      <h2 id="transcript-heading" {...stylex.props(styles.heading)}>
        Transcript
      </h2>
      {utterances.length === 0 && speaking.length === 0 && (
        <p {...stylex.props(styles.empty)}>
          {live
            ? "Listening. Words appear here as people speak."
            : "Nothing transcribed yet. Words appear here once the notetaker is recording."}
        </p>
      )}
      <div ref={content} {...stylex.props(styles.stream)}>
        {/* role=log: a polite live region that announces new lines as they arrive. */}
        <ol role="log" aria-label="Live transcript" {...stylex.props(styles.list)}>
          {utterances.map((utterance) => (
            // The id is the public anchor other panels link evidence to.
            <li key={utterance.id} id={`utterance-${utterance.id}`} {...stylex.props(styles.line)}>
              <div {...stylex.props(styles.meta)}>
                <Speaker name={utterance.speakerName} />
                <time {...stylex.props(styles.time)}>{offset(utterance.startTime)}</time>
              </div>
              <p {...stylex.props(styles.text)}>{utterance.text}</p>
            </li>
          ))}
        </ol>
        {/* Hidden from assistive tech: drafts rewrite themselves several times a
            second, and the log above announces each line once it is final. */}
        {speaking.length > 0 && (
          <ul aria-hidden {...stylex.props(styles.list)}>
            {speaking.map((draft) => (
              <li key={draft.speakerName ?? ""} {...stylex.props(styles.line)}>
                <div {...stylex.props(styles.meta)}>
                  <Speaker name={draft.speakerName} />
                  <span {...stylex.props(styles.speaking)}>
                    <span {...stylex.props(styles.dot)} />
                    speaking
                  </span>
                </div>
                <p {...stylex.props(styles.text, styles.draftText)}>{draft.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Speaker({ name }: { name: string | null }) {
  return (
    <span {...stylex.props(styles.speaker, name === null && styles.unknown)}>
      {name ?? "Unknown speaker"}
    </span>
  );
}
