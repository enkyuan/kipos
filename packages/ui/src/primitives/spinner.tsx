import * as stylex from "@stylexjs/stylex";
import type { ComponentProps, ReactElement } from "react";
import { media } from "../tokens/tokens.stylex";

// coss spinner: lucide's loader-circle, spinning. coss marks the icon
// role=status; here it is decorative, and the status region belongs to the
// text beside it that says what is loading.
const spin = stylex.keyframes({ to: { rotate: "360deg" } });

const styles = stylex.create({
  spinner: {
    flexShrink: 0,
    width: "1rem",
    height: "1rem",
    animationName: spin,
    // Reduced motion slows the spin rather than stopping it: a still spinner
    // would read as frozen.
    animationDuration: { default: "1s", [media.reducedMotion]: "2s" },
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  },
});

export type SpinnerProps = Omit<ComponentProps<"svg">, "className" | "style"> & {
  xstyle?: stylex.StyleXStyles;
};

/**
 * `import { Spinner } from "@kipos/ui/spinner"`. Decorative: put it beside
 * text in a status region (`<output>`) that says what is loading.
 */
export function Spinner({ xstyle, ...props }: SpinnerProps): ReactElement {
  return (
    <svg
      aria-hidden
      data-slot="spinner"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...stylex.props(styles.spinner, xstyle)}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
