import * as stylex from "@stylexjs/stylex";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { ReactElement } from "react";
import { color, fontSize, fontWeight, media, radius, space } from "../tokens/tokens.stylex";

// coss badge. Status tones are an 8% tint of the tone (16% in dark) under
// the tone's foreground shade, so the label keeps its contrast.

const tint = (tone: string) => ({
  default: `color-mix(in srgb, ${tone} 8%, transparent)`,
  [media.dark]: `color-mix(in srgb, ${tone} 16%, transparent)`,
});

const styles = stylex.create({
  base: {
    position: "relative",
    display: "inline-flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: space.s1,
    whiteSpace: "nowrap",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "transparent",
    borderRadius: radius.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 1,
  },
});

const sizes = stylex.create({
  default: {
    height: { default: "1.375rem", [media.sm]: "1.125rem" },
    minWidth: { default: "1.375rem", [media.sm]: "1.125rem" },
    paddingInline: `calc(${space.s1} - 1px)`,
    fontSize: { default: fontSize.sm, [media.sm]: fontSize.xs },
  },
  sm: {
    height: { default: "1.25rem", [media.sm]: "1rem" },
    minWidth: { default: "1.25rem", [media.sm]: "1rem" },
    paddingInline: `calc(${space.s1} - 1px)`,
    borderRadius: "0.25rem",
    fontSize: { default: fontSize.xs, [media.sm]: "0.625rem" },
  },
  lg: {
    height: { default: "1.625rem", [media.sm]: "1.375rem" },
    minWidth: { default: "1.625rem", [media.sm]: "1.375rem" },
    paddingInline: `calc(${space.s1_5} - 1px)`,
    fontSize: { default: fontSize.base, [media.sm]: fontSize.sm },
  },
});

const variants = stylex.create({
  default: { backgroundColor: color.primary, color: color.primaryForeground },
  secondary: { backgroundColor: color.secondary, color: color.secondaryForeground },
  outline: {
    borderColor: color.input,
    backgroundColor: color.background,
    color: color.foreground,
  },
  destructive: { backgroundColor: color.destructive, color: color.white },
  error: { backgroundColor: tint(color.destructive), color: color.destructiveForeground },
  info: { backgroundColor: tint(color.info), color: color.infoForeground },
  success: { backgroundColor: tint(color.success), color: color.successForeground },
  warning: { backgroundColor: tint(color.warning), color: color.warningForeground },
});

export type BadgeVariant = keyof typeof variants;
export type BadgeSize = keyof typeof sizes;

export type BadgeProps = Omit<useRender.ComponentProps<"span">, "className" | "style"> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  xstyle?: stylex.StyleXStyles;
};

/** `import { Badge } from "@kipos/ui/badge"`. A label, never a control. */
export function Badge({
  variant = "default",
  size = "default",
  render,
  xstyle,
  ...props
}: BadgeProps): ReactElement {
  const ownProps = {
    ...stylex.props(styles.base, sizes[size], variants[variant], xstyle),
    "data-slot": "badge",
  };
  return useRender({ defaultTagName: "span", render, props: mergeProps<"span">(ownProps, props) });
}
