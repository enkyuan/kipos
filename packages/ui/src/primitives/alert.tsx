import * as stylex from "@stylexjs/stylex";
import type { ComponentProps, ReactElement } from "react";
import {
  color,
  fontSize,
  fontWeight,
  lineHeight,
  media,
  radius,
  space,
} from "../tokens/tokens.stylex";

// coss alert, without the icon column: a bordered panel tinted by tone
// (32% border, 4% fill), mixed in oklab as Tailwind's `/32` is.
const tone = (value: string) => ({
  borderColor: `color-mix(in oklab, ${value} 32%, transparent)`,
  backgroundColor: `color-mix(in oklab, ${value} 4%, transparent)`,
});

const styles = stylex.create({
  root: {
    display: "grid",
    gap: `${space.s0_5} ${space.s2}`,
    width: "100%",
    paddingBlock: space.s3,
    paddingInline: space.s3_5,
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: radius.xl,
    color: color.cardForeground,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  title: { fontWeight: fontWeight.medium },
  description: {
    display: "flex",
    flexDirection: "column",
    gap: space.s2_5,
    color: color.mutedForeground,
  },
});

const variants = stylex.create({
  default: {
    borderColor: color.border,
    backgroundColor: {
      default: "transparent",
      [media.dark]: `color-mix(in srgb, ${color.input} 32%, transparent)`,
    },
  },
  error: tone(color.destructive),
  info: tone(color.info),
  success: tone(color.success),
  warning: tone(color.warning),
});

export type AlertVariant = keyof typeof variants;

type Styled<Props> = Omit<Props, "className" | "style"> & { xstyle?: stylex.StyleXStyles };

/**
 * `import { Alert, AlertTitle, AlertDescription } from "@ouro/ui/alert"`.
 * It is `role="alert"` by default, as in coss; pass `role="note"` (or
 * `"status"`) for standing information that should not interrupt.
 */
export function Alert({
  variant = "default",
  xstyle,
  ...props
}: Styled<ComponentProps<"div">> & { variant?: AlertVariant }): ReactElement {
  return (
    <div
      role="alert"
      data-slot="alert"
      {...stylex.props(styles.root, variants[variant], xstyle)}
      {...props}
    />
  );
}

export function AlertTitle({ xstyle, ...props }: Styled<ComponentProps<"div">>): ReactElement {
  return <div data-slot="alert-title" {...stylex.props(styles.title, xstyle)} {...props} />;
}

export function AlertDescription({
  xstyle,
  ...props
}: Styled<ComponentProps<"div">>): ReactElement {
  return (
    <div data-slot="alert-description" {...stylex.props(styles.description, xstyle)} {...props} />
  );
}
