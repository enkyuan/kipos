import { useRender } from "@base-ui/react/use-render";
import type { ReactElement } from "react";
import { classes, type Styled } from "./classes";

/** A surface that sits on the container. Pass `render={<section />}` for another element. */
export function Card({
  className,
  render,
  ...props
}: Styled<useRender.ComponentProps<"div">>): ReactElement {
  return useRender({
    defaultTagName: "div",
    render,
    props: { ...props, className: classes("nm-card", className), "data-slot": "card" },
  });
}
