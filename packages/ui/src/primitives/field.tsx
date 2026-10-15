import * as stylex from "@stylexjs/stylex";
import { Field as BaseField } from "@base-ui/react/field";
import type { ReactElement } from "react";
import { color, fontSize, fontWeight, lineHeight, media, space } from "../tokens/tokens.stylex";

// coss field: Base UI owns labelling, description wiring and validity;
// these parts only style it.

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: space.s2,
  },
  label: {
    display: "inline-flex",
    alignItems: "center",
    gap: space.s2,
    color: color.foreground,
    fontSize: { default: fontSize.base, [media.sm]: fontSize.sm },
    fontWeight: fontWeight.medium,
    lineHeight: { default: "1.125rem", [media.sm]: "1rem" },
    opacity: { default: null, ":is([data-disabled])": 0.64 },
  },
  description: { color: color.mutedForeground, fontSize: fontSize.xs, lineHeight: lineHeight.xs },
  error: { color: color.destructiveForeground, fontSize: fontSize.xs, lineHeight: lineHeight.xs },
});

type Styled<Props> = Omit<Props, "className" | "style"> & { xstyle?: stylex.StyleXStyles };

/** `import { Field, FieldLabel, FieldDescription, FieldError } from "@kipos/ui/field"`. */
export function Field({ xstyle, ...props }: Styled<BaseField.Root.Props>): ReactElement {
  return <BaseField.Root {...stylex.props(styles.root, xstyle)} data-slot="field" {...props} />;
}

export function FieldLabel({ xstyle, ...props }: Styled<BaseField.Label.Props>): ReactElement {
  return (
    <BaseField.Label {...stylex.props(styles.label, xstyle)} data-slot="field-label" {...props} />
  );
}

export function FieldDescription({
  xstyle,
  ...props
}: Styled<BaseField.Description.Props>): ReactElement {
  return (
    <BaseField.Description
      {...stylex.props(styles.description, xstyle)}
      data-slot="field-description"
      {...props}
    />
  );
}

export function FieldError({ xstyle, ...props }: Styled<BaseField.Error.Props>): ReactElement {
  return (
    <BaseField.Error {...stylex.props(styles.error, xstyle)} data-slot="field-error" {...props} />
  );
}
