import type { ComponentProps, ReactElement } from "react";
import { classes } from "./classes";

/** A placeholder block; size it with `className` (`h-4 w-32`). Hidden from assistive tech. */
export function Skeleton({ className, ...props }: ComponentProps<"div">): ReactElement {
  return (
    <div
      aria-hidden
      {...props}
      className={classes("nm-skeleton", className)}
      data-slot="skeleton"
    />
  );
}
