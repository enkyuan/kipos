import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import type { MeetingSession } from "#api/client";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@kipos/ui/dialog";
import {
  color,
  font,
  fontSize,
  fontWeight,
  lineHeight,
  media,
  motion,
  radius,
  shadow,
  space,
  tracking,
} from "@kipos/ui/tokens.stylex";
import { StatusBadge } from "./meeting-status";
import { StartShadowingForm } from "./start-shadowing-form";
import { useMeetings } from "./use-meetings";

const focusRing = `0 0 0 ${shadow.focusOffset} ${color.background}, 0 0 0 ${shadow.focusWidth} ${color.ring}`;

const styles = stylex.create({
  title: {
    fontFamily: font.heading,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.medium,
    letterSpacing: tracking.heading,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(auto-fill, minmax(9rem, 1fr))",
      [media.sm]: "repeat(auto-fill, minmax(14rem, 1fr))",
    },
    gap: { default: space.s3, [media.sm]: space.s4 },
    padding: 0,
    margin: 0,
    listStyle: "none",
  },
  message: { color: color.mutedForeground, fontSize: fontSize.sm },
  // A borderless file-browser tile. The meeting cards and the "New meeting"
  // trigger share it so they sit in the grid as equals.
  tile: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    aspectRatio: "16 / 10",
    padding: 0,
    borderWidth: 0,
    borderRadius: radius.xl,
    backgroundColor: {
      default: color.muted,
      ":hover": { default: null, [media.hover]: color.input },
    },
    color: color.foreground,
    fontFamily: "inherit",
    textDecoration: "none",
    cursor: "pointer",
    outline: "none",
    boxShadow: { default: null, ":focus-visible": focusRing },
    scale: { default: null, ":active": { default: motion.press, [media.reducedMotion]: null } },
    transitionProperty: "background-color, box-shadow, scale",
    transitionDuration: motion.fast,
    transitionTimingFunction: motion.ease,
  },
  plus: { width: "2rem", height: "2rem", color: color.info },
  badge: { position: "absolute", top: space.s2_5, insetInlineStart: space.s2_5 },
  caption: {
    position: "absolute",
    insetInlineEnd: space.s3_5,
    bottom: space.s3,
    display: "flex",
    flexDirection: "column",
    gap: space.s0_5,
    textAlign: "end",
  },
  name: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, lineHeight: lineHeight.sm },
  code: {
    color: color.mutedForeground,
    fontFamily: font.mono,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
  },
});

/** The Google Meet code (`abc-defg-hij`) of a session's canonical meeting link. */
const meetCode = (session: MeetingSession) => new URL(session.meetingUrl).pathname.slice(1);

/**
 * The person's meetings as a file browser: a "New meeting" tile that starts
 * shadowing through a dialog, then every session, newest first.
 */
export function MeetingGrid({ onStarted }: { onStarted: (meetingId: string) => void }) {
  const meetings = useMeetings();
  return (
    <>
      <h1 {...stylex.props(styles.title)}>Meetings</h1>
      <ul aria-label="Meetings" {...stylex.props(styles.grid)}>
        <li>
          <NewMeetingTile onStarted={onStarted} />
        </li>
        {meetings.kind === "ready" &&
          meetings.meetings.map((session) => (
            <li key={session.id}>
              <MeetingTile session={session} />
            </li>
          ))}
      </ul>
      {meetings.kind === "loading" && (
        <output {...stylex.props(styles.message)}>Loading your meetings…</output>
      )}
      {meetings.kind === "unavailable" && (
        <p role="alert" {...stylex.props(styles.message)}>
          Couldn't load your meetings. Refresh the page to try again.
        </p>
      )}
      {meetings.kind === "ready" && meetings.meetings.length === 0 && (
        <p {...stylex.props(styles.message)}>
          No meetings yet. Start with a Google Meet link and they'll collect here.
        </p>
      )}
    </>
  );
}

function NewMeetingTile({ onStarted }: { onStarted: (meetingId: string) => void }) {
  return (
    <Dialog>
      <DialogTrigger
        aria-label="New meeting"
        render={<button type="button" {...stylex.props(styles.tile)} />}
      >
        <svg
          aria-hidden="true"
          {...stylex.props(styles.plus)}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Shadow a meeting</DialogTitle>
          <DialogDescription>
            Send a notetaker to a Google Meet and follow the transcript as people speak.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <StartShadowingForm onStarted={onStarted} />
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}

function MeetingTile({ session }: { session: MeetingSession }) {
  return (
    <Link
      to="/meetings/$meetingId"
      params={{ meetingId: session.id }}
      {...stylex.props(styles.tile)}
    >
      {session.status !== "ended" && (
        <span {...stylex.props(styles.badge)}>
          <StatusBadge status={session.status} />
        </span>
      )}
      <span {...stylex.props(styles.caption)}>
        <span {...stylex.props(styles.name)}>
          {new Date(session.startedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
        </span>
        <span {...stylex.props(styles.code)}>{meetCode(session)}</span>
      </span>
    </Link>
  );
}
