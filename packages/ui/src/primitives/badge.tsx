import type { ComponentProps, ReactElement } from "react";
import { classes } from "./classes";

export type BadgeVariant = "default" | "brand" | "positive" | "warning" | "danger" | "info";

export type BadgeProps = ComponentProps<"span"> & { variant?: BadgeVariant };

export function Badge({ variant = "default", className, ...props }: BadgeProps): ReactElement {
  return (
    <span
      {...props}
      className={classes("nm-badge", variant !== "default" && `nm-badge-${variant}`, className)}
      data-slot="badge"
      data-variant={variant}
    />
  );
}
