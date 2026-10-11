import * as stylex from "@stylexjs/stylex";
import type { MeetingSession, MeetingStatus } from "#api/client";
import { Alert, AlertDescription, AlertTitle } from "@ouro/ui/alert";
import { Badge, type BadgeSize, type BadgeVariant } from "@ouro/ui/badge";
import { color, fontSize, motion, radius, space } from "@ouro/ui/tokens.stylex";
import type { Connection } from "./use-meeting";

const pulse = stylex.keyframes({ "50%": { opacity: 0.3 } });

const styles = stylex.create({
  panel: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: space.s3 },
  row: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: space.s2 },
  dot: {
    width: "0.5rem",
    height: "0.5rem",
    borderRadius: radius.full,
    backgroundColor: "currentColor",
    animationName: pulse,
    animationDuration: { default: "1.6s", "@media (prefers-reduced-motion: reduce)": "0s" },
    animationIterationCount: "infinite",
    animationTimingFunction: motion.ease,
  },
  detail: { color: color.mutedForeground, fontSize: fontSize.sm },
});

type StatusCopy = { label: string; detail: string; variant: BadgeVariant };

// Only `recording` says "listening": it is the provider's confirmation.
const COPY: Record<MeetingStatus, StatusCopy> = {
  requested: {
    label: "Requesting notetaker",
    detail: "Asking Vexa to send the notetaker to the meeting.",
    variant: "outline",
  },
  joining: {
    label: "Joining",
    detail: "The notetaker is connecting to the meeting. Nothing is recorded yet.",
    variant: "info",
  },
  waiting_room: {
    label: "Waiting to be admitted",
    detail: "The host must admit “Ouro notetaker” in Google Meet. Nothing is recorded until then.",
    variant: "warning",
  },
  needs_help: {
    label: "Needs help to join",
    detail:
      "The notetaker is stuck joining (for example, a sign-in or captcha). Nothing is recorded.",
    variant: "warning",
  },
  recording: {
    label: "Listening",
    detail: "Admitted and transcribing. Words appear below as people speak.",
    variant: "success",
  },
  ended: {
    label: "Ended",
    detail: "The notetaker has left the meeting. The transcript below is saved.",
    variant: "secondary",
  },
  failed: { label: "Failed", detail: "", variant: "error" },
};

const CONNECTION_COPY: Record<Connection, string> = {
  connecting: "Connecting to live updates…",
  live: "Live updates on.",
  reconnecting: "Live updates interrupted. Reconnecting…",
};

/** The session's status as a badge; a recording session pulses. */
export function StatusBadge({ status, size }: { status: MeetingStatus; size?: BadgeSize }) {
  return (
    <Badge variant={COPY[status].variant} size={size}>
      {status === "recording" && <span aria-hidden {...stylex.props(styles.dot)} />}
      {COPY[status].label}
    </Badge>
  );
}

/** The meeting's actual state, as last reported by the provider. */
export function MeetingStatusPanel({
  session,
  connection,
}: {
  session: MeetingSession;
  connection: Connection;
}) {
  const copy = COPY[session.status];
  const finished = session.status === "ended" || session.status === "failed";
  return (
    <section aria-label="Notetaker status" {...stylex.props(styles.panel)}>
      <output {...stylex.props(styles.row)}>
        <StatusBadge status={session.status} size="lg" />
        {copy.detail && <span {...stylex.props(styles.detail)}>{copy.detail}</span>}
      </output>
      {!finished && <span {...stylex.props(styles.detail)}>{CONNECTION_COPY[connection]}</span>}
      {session.status === "requested" && session.errorMessage && (
        <Alert variant="warning" role="note">
          <AlertTitle>Vexa hasn't confirmed the notetaker yet</AlertTitle>
          <AlertDescription>{session.errorMessage}</AlertDescription>
        </Alert>
      )}
      {session.status === "failed" && (
        <Alert variant="error">
          <AlertTitle>The notetaker could not shadow this meeting</AlertTitle>
          <AlertDescription>
            {session.errorMessage ?? "The provider reported a failure."}
          </AlertDescription>
        </Alert>
      )}
    </section>
  );
}
