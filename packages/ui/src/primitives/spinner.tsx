import type { ComponentProps, ReactElement } from "react";
import { classes } from "./classes";

export type SpinnerProps = Omit<ComponentProps<"output">, "children"> & {
  size?: "sm" | "md" | "lg";
};

/** Indeterminate activity in the surrounding text color. Name what is loading with `aria-label`. */
export function Spinner({ size = "md", className, ...props }: SpinnerProps): ReactElement {
  return (
    <output
      aria-label="Loading"
      {...props}
      className={classes("nm-spinner", size !== "md" && `nm-spinner-${size}`, className)}
      data-slot="spinner"
    />
  );
}
