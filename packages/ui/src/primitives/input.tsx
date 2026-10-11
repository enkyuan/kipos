import * as stylex from "@stylexjs/stylex";
import { Input as BaseInput } from "@base-ui/react/input";
import type { ReactElement } from "react";
import { color, fontSize, media, motion, radius, shadow, space } from "../tokens/tokens.stylex";

// coss input: a styled control box (`data-slot=input-control`) around a
// borderless input. The box draws focus and invalid states from what its
// input reports (`:has(...)`), so Base UI's Field validity reaches it with
// no extra props.
const FOCUS = ":has(:focus-visible)";
const INVALID = ":has([aria-invalid=true])";
const DISABLED = ":has(:disabled)";

const styles = stylex.create({
  control: {
    position: "relative",
    display: "inline-flex",
    width: "100%",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: {
      default: color.input,
      [INVALID]: `color-mix(in srgb, ${color.destructive} 36%, transparent)`,
      [FOCUS]: color.ring,
      [`${FOCUS}${INVALID}`]: `color-mix(in srgb, ${color.destructive} 64%, transparent)`,
    },
    borderRadius: radius.lg,
    backgroundColor: {
      default: color.background,
      [media.dark]: `color-mix(in srgb, ${color.input} 32%, transparent)`,
    },
    backgroundClip: { default: "padding-box", [media.dark]: null },
    fontSize: { default: fontSize.base, [media.sm]: fontSize.sm },
    boxShadow: {
      default: shadow.xs,
      [DISABLED]: "none",
      [INVALID]: "none",
      [FOCUS]: `0 0 0 3px color-mix(in srgb, ${color.ring} 24%, transparent)`,
      [`${FOCUS}${INVALID}`]: `0 0 0 3px color-mix(in srgb, ${color.destructive} 16%, transparent)`,
    },
    opacity: { default: null, [DISABLED]: 0.64 },
    transitionProperty: "box-shadow",
    transitionDuration: motion.fast,
    transitionTimingFunction: motion.ease,
    "::before": {
      content: "''",
      position: "absolute",
      inset: 0,
      borderRadius: `calc(${radius.lg} - 1px)`,
      boxShadow: color.highlight,
      pointerEvents: "none",
    },
  },
  // The resting highlight goes once the box takes a state of its own.
  plain: {
    "::before": {
      opacity: { default: 1, [FOCUS]: 0, [INVALID]: 0, [DISABLED]: 0 },
    },
  },
  input: {
    width: "100%",
    minWidth: 0,
    margin: 0,
    paddingInline: `calc(${space.s3} - 1px)`,
    borderWidth: 0,
    borderRadius: "inherit",
    backgroundColor: "transparent",
    color: color.foreground,
    font: "inherit",
    outline: "none",
    "::placeholder": { color: `color-mix(in srgb, ${color.mutedForeground} 72%, transparent)` },
  },
  sm: {
    height: { default: "1.875rem", [media.sm]: "1.625rem" },
    paddingInline: `calc(${space.s2_5} - 1px)`,
  },
  default: { height: { default: "2.125rem", [media.sm]: "1.875rem" } },
  lg: { height: { default: "2.375rem", [media.sm]: "2.125rem" } },
});

export type InputProps = Omit<BaseInput.Props, "className" | "style" | "size"> & {
  size?: "sm" | "default" | "lg";
  /** The bare input with no control box, for a box drawn by its container (`InputGroup`). */
  unstyled?: boolean;
  /** Styles for the control box (width, margins), not the text; the input itself when `unstyled`. */
  xstyle?: stylex.StyleXStyles;
};

/**
 * `import { Input } from "@ouro/ui/input"`. Inside `Field.Root` it takes the
 * field's label, description and validity automatically.
 */
export function Input({
  size = "default",
  unstyled = false,
  xstyle,
  ...props
}: InputProps): ReactElement {
  if (unstyled) {
    return (
      <BaseInput
        {...stylex.props(styles.input, styles[size], xstyle)}
        data-slot="input"
        {...props}
      />
    );
  }
  return (
    <span {...stylex.props(styles.control, styles.plain, xstyle)} data-slot="input-control">
      <BaseInput {...stylex.props(styles.input, styles[size])} data-slot="input" {...props} />
    </span>
  );
}
