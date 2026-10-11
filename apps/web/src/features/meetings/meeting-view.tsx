import * as stylex from "@stylexjs/stylex";
import { Button } from "@ouro/ui/button";
import { color, font, fontSize, fontWeight, media, space, tracking } from "@ouro/ui/tokens.stylex";
import type { ReactNode } from "react";
import { ConsentNotice } from "./consent-notice";
import { MeetingStatusPanel } from "./meeting-status";
import { TranscriptList } from "./transcript-list";
import { useMeeting } from "./use-meeting";

const styles = stylex.create({
  header: { display: "flex", flexDirection: "column", gap: space.s1 },
  title: {
    fontFamily: font.heading,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.medium,
    letterSpacing: tracking.heading,
  },
  link: { color: color.mutedForeground, fontSize: fontSize.sm, overflowWrap: "anywhere" },
  message: { color: color.mutedForeground },
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

/**
 * One shadowed meeting: its live state, the recording notice, and the
 * transcript, with an optional side panel (`aside`) beside it.
 */
export function MeetingView({ meetingId, aside }: { meetingId: string; aside?: ReactNode }) {
  const meeting = useMeeting(meetingId);

  if (meeting.kind !== "ready") {
    const message = {
      loading: "Loading the meeting…",
      missing: "There is no meeting session at this address.",
      unavailable: "Couldn't load this meeting. Refresh the page to try again.",
    }[meeting.kind];
    return (
      <>
        <h1 {...stylex.props(styles.title)}>Meeting</h1>
        <p role={meeting.kind === "loading" ? "status" : "alert"} {...stylex.props(styles.message)}>
          {message}
        </p>
        {meeting.kind === "missing" && (
          <Button variant="outline" render={<a href="/" />}>
            Shadow a meeting
          </Button>
        )}
      </>
    );
  }

  const { session, utterances, connection } = meeting;
  return (
    <div {...stylex.props(styles.columns)}>
      <div {...stylex.props(styles.main)}>
        <header {...stylex.props(styles.header)}>
          <h1 {...stylex.props(styles.title)}>Meeting</h1>
          <a
            href={session.meetingUrl}
            target="_blank"
            rel="noreferrer"
            {...stylex.props(styles.link)}
          >
            {session.meetingUrl}
          </a>
        </header>
        <MeetingStatusPanel session={session} connection={connection} />
        <ConsentNotice />
        <TranscriptList utterances={utterances} status={session.status} />
      </div>
      {aside && <div {...stylex.props(styles.aside)}>{aside}</div>}
    </div>
  );
}
