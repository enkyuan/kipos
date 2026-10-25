import { Separator } from "@base-ui/react/separator";
import type { ReactElement } from "react";
import { classes, type Styled } from "./classes";

/** A hairline between groups; Base UI supplies `role="separator"` and orientation. */
export function Divider({ className, ...props }: Styled<Separator.Props>): ReactElement {
  return <Separator {...props} className={classes("nm-divider", className)} data-slot="divider" />;
}
