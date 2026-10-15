import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { Button } from "@kipos/ui/button";
import { Spinner } from "@kipos/ui/spinner";
import { color, font, fontSize, fontWeight, media, space, tracking } from "@kipos/ui/tokens.stylex";
import type { ReactNode } from "react";
import { MeetingLink } from "./meeting-link";
import { MeetingStatusPanel } from "./meeting-status";
import { TranscriptList } from "./transcript-list";
import { useMeeting } from "./use-meeting";

const styles = stylex.create({
  header: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: space.s3 },
  // Pulls the ghost button's padding into the gutter so its chevron lines
  // up with the title below it.
  back: { marginInlineStart: `calc(-1 * ${space.s2_5})`, color: color.mutedForeground },
  title: {
    fontFamily: font.heading,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.medium,
    letterSpacing: tracking.heading,
    textWrap: "balance",
  },
  // The meet link field fills the column, not just the title's width.
  link: { alignSelf: "stretch" },
  message: { color: color.mutedForeground },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: space.s2,
    minHeight: "50dvh",
    color: color.mutedForeground,
    fontSize: fontSize.sm,
  },
  columns: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [media.lg]: "minmax(0, 1fr) 24rem" },
    alignItems: "start",
    gap: space.s8,
  },
  main: { display: "flex", flexDirection: "column", gap: space.s6, minWidth: 0 },
  aside: {
    position: { default: "static", [media.lg]: "sticky" },
    top: space.s6,
    maxHeight: { default: null, [media.lg]: `calc(100dvh - ${space.s12})` },
    overflowY: { default: null, [media.lg]: "auto" },
  },
});

/** When the session started, as the meetings grid names it, with the time. */
const startedLabel = (startedAt: string) =>
  new Date(startedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

function MeetingHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header {...stylex.props(styles.header)}>
      <Button variant="ghost" size="sm" xstyle={styles.back} render={<Link to="/" />}>
        <svg
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Meetings
      </Button>
      <h1 {...stylex.props(styles.title)}>{title}</h1>
      {children}
    </header>
  );
}

/**
 * One shadowed meeting: its live state and the transcript, with an optional
 * side panel (`aside`) beside it.
 */
export function MeetingView({ meetingId, aside }: { meetingId: string; aside?: ReactNode }) {
  const meeting = useMeeting(meetingId);

  if (meeting.kind === "loading") {
    return (
      <>
        <MeetingHeader title="Meeting" />
        <output {...stylex.props(styles.loading)}>
          <Spinner />
          Loading the meeting…
        </output>
      </>
    );
  }

  if (meeting.kind !== "ready") {
    const message = {
      missing: "There is no meeting session at this address.",
      unavailable: "Couldn't load this meeting. Refresh the page to try again.",
    }[meeting.kind];
    return (
      <>
        <MeetingHeader title="Meeting" />
        <p role="alert" {...stylex.props(styles.message)}>
          {message}
        </p>
      </>
    );
  }

  const { session, utterances, drafts, connection } = meeting;
  return (
    <div {...stylex.props(styles.columns)}>
      <div {...stylex.props(styles.main)}>
        <MeetingHeader title={startedLabel(session.startedAt)}>
          <div {...stylex.props(styles.link)}>
            <MeetingLink url={session.meetingUrl} />
          </div>
        </MeetingHeader>
        <MeetingStatusPanel session={session} connection={connection} />
        <TranscriptList utterances={utterances} drafts={drafts} status={session.status} />
      </div>
      {aside && <div {...stylex.props(styles.aside)}>{aside}</div>}
    </div>
  );
}
