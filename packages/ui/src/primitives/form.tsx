import * as stylex from "@stylexjs/stylex";
import { Form as BaseForm } from "@base-ui/react/form";
import type { ReactElement } from "react";
import { space } from "../tokens/tokens.stylex";

const styles = stylex.create({
  form: { display: "flex", flexDirection: "column", gap: space.s4, width: "100%" },
});

export type FormProps<Values extends Record<string, unknown>> = Omit<
  BaseForm.Props<Values>,
  "className" | "style"
> & { xstyle?: stylex.StyleXStyles };

/**
 * `import { Form } from "@kipos/ui/form"`. Base UI validates every `Field`
 * on submit, focuses the first invalid one, and calls `onFormSubmit` with
 * the values by field name only when all are valid. Server-side failures
 * go back through `errors` (`{ email: "…" }`) and show in each FieldError.
 */
export function Form<Values extends Record<string, unknown>>({
  xstyle,
  ...props
}: FormProps<Values>): ReactElement {
  return <BaseForm<Values> {...stylex.props(styles.form, xstyle)} data-slot="form" {...props} />;
}
