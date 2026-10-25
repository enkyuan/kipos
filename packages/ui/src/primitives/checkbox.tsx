import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import type { ReactElement } from "react";
import { classes, type Styled } from "./classes";

export type CheckboxProps = Styled<BaseCheckbox.Root.Props>;

export function Checkbox({ className, ...props }: CheckboxProps): ReactElement {
  return (
    <BaseCheckbox.Root
      {...props}
      className={classes("nm-checkbox", className)}
      data-slot="checkbox"
    >
      <BaseCheckbox.Indicator className="nm-checkbox-indicator" data-slot="checkbox-indicator">
        <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path className="nm-checkbox-check" d="M1.5 5.5 4 8l4.5-6" />
          <path className="nm-checkbox-minus" d="M2 5h6" />
        </svg>
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
