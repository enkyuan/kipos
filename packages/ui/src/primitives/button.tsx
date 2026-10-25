import * as stylex from "@stylexjs/stylex";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { ReactElement } from "react";
import {
  color,
  fontSize,
  fontWeight,
  media,
  motion,
  radius,
  shadow,
  space,
} from "../tokens/tokens.stylex";

// coss button (packages/ui/src/components/button.tsx), translated class by
// class. Controls are a step larger below the `sm` breakpoint so touch
// targets stay comfortable. Hover sits under `media.hover`, as Tailwind v4's
// `hover:` does, so a tap never leaves a button looking hovered. Icons inside
// are sized by base.css (`[data-slot=button] svg`), since StyleX cannot
// style descendants. One addition to coss: a pressed button shrinks
// slightly, so a click is felt before its result arrives.

const focusRing = `0 0 0 ${shadow.focusOffset} ${color.background}, 0 0 0 ${shadow.focusWidth} ${color.ring}`;

const styles = stylex.create({
  base: {
    position: "relative",
    display: "inline-flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: space.s2,
    margin: 0,
    whiteSpace: "nowrap",
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: radius.lg,
    fontFamily: "inherit",
    fontSize: { default: fontSize.base, [media.sm]: fontSize.sm },
    fontWeight: fontWeight.medium,
    lineHeight: 1,
    textDecoration: "none",
    cursor: "pointer",
    outline: "none",
    transitionProperty: "box-shadow, background-color, scale",
    transitionDuration: motion.fast,
    transitionTimingFunction: motion.ease,
    scale: { default: null, ":active": { default: motion.press, [media.reducedMotion]: null } },
    opacity: { default: null, ":disabled": 0.64 },
    pointerEvents: { default: null, ":disabled": "none" },
    // The raised highlight sits on its own layer so it keeps the radius.
    "::before": {
      content: "''",
      position: "absolute",
      inset: 0,
      borderRadius: `calc(${radius.lg} - 1px)`,
      pointerEvents: "none",
    },
  },
});

const sizes = stylex.create({
  default: {
    height: { default: "2.25rem", [media.sm]: "2rem" },
    paddingInline: `calc(${space.s3} - 1px)`,
  },
  sm: {
    height: { default: "2rem", [media.sm]: "1.75rem" },
    gap: space.s1_5,
    paddingInline: `calc(${space.s2_5} - 1px)`,
  },
  lg: {
    height: { default: "2.5rem", [media.sm]: "2.25rem" },
    paddingInline: `calc(${space.s3_5} - 1px)`,
  },
  xl: {
    height: { default: "2.75rem", [media.sm]: "2.5rem" },
    paddingInline: `calc(${space.s4} - 1px)`,
    fontSize: { default: fontSize.lg, [media.sm]: fontSize.base },
  },
  xs: {
    height: { default: "1.75rem", [media.sm]: "1.5rem" },
    gap: space.s1,
    paddingInline: `calc(${space.s2} - 1px)`,
    borderRadius: radius.md,
    fontSize: { default: fontSize.sm, [media.sm]: fontSize.xs },
    "::before": { borderRadius: `calc(${radius.md} - 1px)` },
  },
  icon: {
    width: { default: "2.25rem", [media.sm]: "2rem" },
    height: { default: "2.25rem", [media.sm]: "2rem" },
    padding: 0,
  },
  "icon-xs": {
    width: { default: "1.75rem", [media.sm]: "1.5rem" },
    height: { default: "1.75rem", [media.sm]: "1.5rem" },
    padding: 0,
    borderRadius: radius.md,
    "::before": { borderRadius: `calc(${radius.md} - 1px)` },
  },
});

const variants = stylex.create({
  default: {
    borderColor: color.primary,
    backgroundColor: {
      default: color.primary,
      ":hover": {
        default: null,
        [media.hover]: `color-mix(in srgb, ${color.primary} 90%, transparent)`,
      },
    },
    color: color.primaryForeground,
    boxShadow: {
      default: `${color.insetLight}, 0 1px 2px 0 color-mix(in srgb, ${color.primary} 24%, transparent)`,
      ":active": color.insetDark,
      ":focus-visible": focusRing,
      ":disabled": "none",
    },
  },
  destructive: {
    borderColor: color.destructive,
    backgroundColor: {
      default: color.destructive,
      ":hover": {
        default: null,
        [media.hover]: `color-mix(in srgb, ${color.destructive} 90%, transparent)`,
      },
    },
    color: color.white,
    boxShadow: {
      default: `${color.insetLight}, 0 1px 2px 0 color-mix(in srgb, ${color.destructive} 24%, transparent)`,
      ":active": color.insetDark,
      ":focus-visible": focusRing,
      ":disabled": "none",
    },
  },
  outline: {
    borderColor: color.input,
    backgroundColor: {
      default: color.popover,
      ":hover": {
        default: null,
        [media.hover]: `color-mix(in srgb, ${color.accent} 50%, ${color.popover})`,
      },
    },
    backgroundClip: { default: "padding-box", [media.dark]: null },
    color: color.foreground,
    boxShadow: {
      default: shadow.xs,
      ":active": "none",
      ":focus-visible": focusRing,
      ":disabled": "none",
    },
    "::before": { boxShadow: color.highlight },
  },
  secondary: {
    borderColor: "transparent",
    backgroundColor: {
      default: color.secondary,
      ":hover": {
        default: null,
        [media.hover]: `color-mix(in srgb, ${color.secondary} 90%, transparent)`,
      },
      ":active": `color-mix(in srgb, ${color.secondary} 80%, transparent)`,
    },
    color: color.secondaryForeground,
    boxShadow: { default: null, ":focus-visible": focusRing },
  },
  ghost: {
    borderColor: "transparent",
    backgroundColor: {
      default: "transparent",
      ":hover": { default: null, [media.hover]: color.accent },
    },
    color: color.foreground,
    boxShadow: { default: null, ":focus-visible": focusRing },
  },
  link: {
    borderColor: "transparent",
    backgroundColor: "transparent",
    color: color.foreground,
    textDecorationLine: { default: null, ":hover": { default: null, [media.hover]: "underline" } },
    textUnderlineOffset: "4px",
    boxShadow: { default: null, ":focus-visible": focusRing },
  },
});

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export type ButtonProps = Omit<useRender.ComponentProps<"button">, "className" | "style"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  xstyle?: stylex.StyleXStyles;
};

/** `import { Button } from "@kipos/ui/button"`. Pass `render={<a />}` for a link. */
export function Button({
  variant = "default",
  size = "default",
  disabled,
  render,
  children,
  xstyle,
  ...props
}: ButtonProps): ReactElement {
  const ownProps = {
    ...stylex.props(styles.base, sizes[size], variants[variant], xstyle),
    children,
    disabled,
    "data-slot": "button",
    // A rendered <a> or custom element must not get a button type.
    type: render ? undefined : ("button" as const),
  };
  return useRender({
    defaultTagName: "button",
    render,
    props: mergeProps<"button">(ownProps, props),
  });
}
