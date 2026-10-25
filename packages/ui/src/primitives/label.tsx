import type { ComponentProps, ReactElement } from "react";
import { classes } from "./classes";

/** A visible label; associate it with `htmlFor`, or wrap the control it names. */
export function Label({ className, ...props }: ComponentProps<"label">): ReactElement {
  // The caller supplies htmlFor or wraps the control; a primitive cannot know which.
  // oxlint-disable-next-line jsx-a11y/label-has-associated-control
  return <label {...props} className={classes("nm-label", className)} data-slot="label" />;
}
