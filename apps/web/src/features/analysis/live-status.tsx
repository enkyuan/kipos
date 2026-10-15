import * as stylex from "@stylexjs/stylex";
import type { AnalysisState } from "#api/client";
import { Spinner } from "@kipos/ui/spinner";
import { color, fontSize, radius, space } from "@kipos/ui/tokens.stylex";
import { AnimatePresence, motion } from "motion/react";

const styles = stylex.create({
  status: {
    display: "inline-flex",
    alignItems: "center",
    gap: space.s1_5,
    flexShrink: 0,
    color: color.mutedForeground,
    fontSize: fontSize.xs,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  },
  indicator: { display: "inline-flex" },
  dot: { width: "0.375rem", height: "0.375rem", borderRadius: radius.full },
  spinner: { width: "0.75rem", height: "0.75rem" },
});

const DOT = stylex.create({
  muted: { backgroundColor: color.mutedForeground },
  live: { backgroundColor: color.success },
  failed: { backgroundColor: color.destructive },
});

// The indicator blur-swaps between dot and spinner (ADR 0005), so a change
// of state is seen without the words beside it moving.
const swap = { type: "spring", duration: 0.3, bounce: 0 } as const;
const hidden = { opacity: 0, scale: 0.25, filter: "blur(4px)" };
const shown = { opacity: 1, scale: 1, filter: "blur(0px)" };

type Status = { text: string; tone: "muted" | "live" | "failed" | "busy" };

function statusOf(state: AnalysisState | null): Status {
  if (!state) return { text: "Connecting", tone: "muted" };
  if (!state.enabled) return { text: "Off", tone: "muted" };
  if (state.state === "analyzing") return { text: "Analyzing", tone: "busy" };
  if (state.state === "failed") return { text: "Retrying", tone: "failed" };
  if (!state.analyzedAt) return { text: "Waiting for talk", tone: "muted" };
  const at = new Date(state.analyzedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { text: `Updated ${at}`, tone: "live" };
}

const FAILED = "The last analysis failed; the next one retries. The transcript is unaffected.";

/** Where analysis stands, in a few words beside the panel's title. */
export function LiveStatus({ state }: { state: AnalysisState | null }) {
  const { text, tone } = statusOf(state);
  return (
    <output title={tone === "failed" ? FAILED : undefined} {...stylex.props(styles.status)}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={tone}
          initial={hidden}
          animate={shown}
          exit={hidden}
          transition={swap}
          {...stylex.props(styles.indicator)}
        >
          {tone === "busy" ? (
            <Spinner xstyle={styles.spinner} />
          ) : (
            <span aria-hidden {...stylex.props(styles.dot, DOT[tone])} />
          )}
        </motion.span>
      </AnimatePresence>
      {text}
    </output>
  );
}
