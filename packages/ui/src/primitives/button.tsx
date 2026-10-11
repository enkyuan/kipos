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
// style descendants.

const focusRing = `0 0 0 ${shadow.focusOffset} ${color.background}, 0 0 0 ${shadow.focusWidth} ${color.ring}`;
const spin = stylex.keyframes({ to: { rotate: "360deg" } });

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
    transitionProperty: "box-shadow, background-color",
    transitionDuration: motion.fast,
    transitionTimingFunction: motion.ease,
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
  loading: { color: "transparent", userSelect: "none" },
  spinner: {
    position: "absolute",
    width: "1rem",
    height: "1rem",
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: "currentColor",
    borderInlineEndColor: "transparent",
    borderRadius: radius.full,
    animationName: spin,
    // Reduced motion slows the spin rather than stopping it: a still spinner
    // would read as frozen.
    animationDuration: { default: "700ms", [media.reducedMotion]: "1500ms" },
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
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
  icon: {
    width: { default: "2.25rem", [media.sm]: "2rem" },
    height: { default: "2.25rem", [media.sm]: "2rem" },
    padding: 0,
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

// The label turns transparent while loading, so the spinner takes the
// variant's label color explicitly.
const spinnerTone = stylex.create({
  default: { color: color.primaryForeground },
  destructive: { color: color.white },
  outline: { color: color.foreground },
  secondary: { color: color.secondaryForeground },
  ghost: { color: color.foreground },
  link: { color: color.foreground },
});

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export type ButtonProps = Omit<useRender.ComponentProps<"button">, "className" | "style"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Keeps the button's size, hides its label and shows a spinner. */
  loading?: boolean;
  xstyle?: stylex.StyleXStyles;
};

/** `import { Button } from "@ouro/ui/button"`. Pass `render={<a />}` for a link. */
export function Button({
  variant = "default",
  size = "default",
  loading = false,
  disabled,
  render,
  children,
  xstyle,
  ...props
}: ButtonProps): ReactElement {
  const ownProps = {
    ...stylex.props(styles.base, sizes[size], variants[variant], loading && styles.loading, xstyle),
    children: (
      <>
        {children}
        {loading && <span aria-hidden {...stylex.props(styles.spinner, spinnerTone[variant])} />}
      </>
    ),
    disabled: loading || disabled,
    "aria-busy": loading || undefined,
    "data-loading": loading ? "" : undefined,
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
