import * as stylex from "@stylexjs/stylex";
import type { ComponentProps, ReactElement } from "react";
import { color, fontSize, media, motion, radius, shadow, space } from "../tokens/tokens.stylex";
import { Input, type InputProps } from "./input";

// coss input-group (packages/ui/src/components/input-group.tsx), inline
// addons only. The group draws the control box the input would (see
// input.tsx) from what its input reports through `:has(...)`, and the input
// yields its edge padding to an addon beside it. coss's click-the-addon-to-
// focus handler is left out: addons here hold buttons.
const FOCUS = ":has(input:focus-visible)";
const INVALID = ":has(input[aria-invalid=true])";
const DISABLED = ":has(input:disabled)";

const styles = stylex.create({
  group: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    width: "100%",
    minWidth: 0,
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
    color: color.foreground,
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
      opacity: { default: 1, [FOCUS]: 0, [INVALID]: 0, [DISABLED]: 0 },
      pointerEvents: "none",
    },
  },
  input: {
    paddingInlineStart: { default: null, ":is([data-align=inline-start] ~ *)": space.s2 },
    paddingInlineEnd: { default: null, ":has(~ [data-align=inline-end])": space.s2 },
  },
  addon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: space.s2,
    height: "auto",
    userSelect: "none",
  },
  "inline-start": {
    order: -1,
    paddingInlineStart: `calc(${space.s3} - 1px)`,
    marginInlineStart: { default: null, ":has(> [data-slot=button])": `calc(-1 * ${space.s2})` },
  },
  "inline-end": {
    order: 999,
    paddingInlineEnd: `calc(${space.s3} - 1px)`,
    marginInlineEnd: { default: null, ":has(> [data-slot=button])": `calc(-1 * ${space.s2})` },
  },
});

type PartProps = Omit<ComponentProps<"div">, "className" | "style"> & {
  xstyle?: stylex.StyleXStyles;
};

/**
 * `import { InputGroup, InputGroupAddon, InputGroupInput } from
 * "@ouro/ui/input-group"`. An input with buttons inside its box.
 */
export function InputGroup({ xstyle, ...props }: PartProps): ReactElement {
  return <div {...stylex.props(styles.group, xstyle)} data-slot="input-group" {...props} />;
}

export type InputGroupAddonProps = PartProps & { align?: "inline-start" | "inline-end" };

export function InputGroupAddon({
  align = "inline-start",
  xstyle,
  ...props
}: InputGroupAddonProps): ReactElement {
  return (
    <div
      {...stylex.props(styles.addon, styles[align], xstyle)}
      data-align={align}
      data-slot="input-group-addon"
      {...props}
    />
  );
}

export function InputGroupInput({ xstyle, ...props }: Omit<InputProps, "unstyled">): ReactElement {
  return <Input unstyled xstyle={[styles.input, xstyle]} {...props} />;
}
