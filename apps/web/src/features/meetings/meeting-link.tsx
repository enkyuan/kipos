import * as stylex from "@stylexjs/stylex";
import { Button } from "@kipos/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@kipos/ui/input-group";
import { color } from "@kipos/ui/tokens.stylex";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, useState, type MouseEvent } from "react";

const styles = stylex.create({
  group: { maxWidth: "32rem" },
  input: { color: color.mutedForeground, textOverflow: "ellipsis" },
  icon: { display: "inline-flex" },
});

// The swap blurs out of one icon into the other. A spring with no bounce
// retargets smoothly if the state flips back mid-swap; reduced motion
// (`MotionConfig`) keeps the fade and blur and drops the scale.
const hidden = { opacity: 0, scale: 0.25, filter: "blur(4px)" };
const shown = { opacity: 1, scale: 1, filter: "blur(0px)" };
const swap = { type: "spring", duration: 0.3, bounce: 0 } as const;

const ICON = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/** The copy icon, blur-fading into a check once the link is copied. */
function CopyState({ copied }: { copied: boolean }) {
  return (
    <MotionConfig reducedMotion="user">
      {/* No entrance on first render: the icon is simply there. */}
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={copied ? "copied" : "copy"}
          initial={hidden}
          animate={shown}
          exit={hidden}
          transition={swap}
          {...stylex.props(styles.icon)}
        >
          {copied ? (
            <svg {...ICON}>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg {...ICON}>
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
          )}
        </motion.span>
      </AnimatePresence>
    </MotionConfig>
  );
}

/**
 * The meeting's Google Meet link as a read-only field: copy it, or open the
 * meeting. Read-only rather than disabled, so it can still be selected.
 */
export function MeetingLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const reset = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(reset);
  }, [copied]);

  async function copy(event: MouseEvent<HTMLButtonElement>) {
    const field = event.currentTarget.closest("[data-slot=input-group]")?.querySelector("input");
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // The browser refused clipboard access (permissions, an insecure
      // origin): select the link so the person can copy it themselves.
      field?.focus();
      field?.select();
    }
  }

  return (
    <InputGroup xstyle={styles.group}>
      <InputGroupInput
        readOnly
        value={url}
        aria-label="Google Meet link"
        onFocus={(event) => event.currentTarget.select()}
        xstyle={styles.input}
      />
      <InputGroupAddon align="inline-end">
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={copied ? "Link copied" : "Copy link"}
          onClick={copy}
        >
          <CopyState copied={copied} />
        </Button>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Open in Google Meet"
          render={<a href={url} target="_blank" rel="noreferrer" />}
        >
          <svg {...ICON}>
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
}
