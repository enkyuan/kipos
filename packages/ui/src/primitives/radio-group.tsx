import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ReactElement } from "react";
import { classes, type Styled } from "./classes";

export function RadioGroup({ className, ...props }: Styled<BaseRadioGroup.Props>): ReactElement {
  return (
    <BaseRadioGroup
      {...props}
      className={classes("nm-radio-group", className)}
      data-slot="radio-group"
    />
  );
}

export function Radio({ className, ...props }: Styled<BaseRadio.Root.Props>): ReactElement {
  return (
    <BaseRadio.Root {...props} className={classes("nm-radio", className)} data-slot="radio">
      <BaseRadio.Indicator className="nm-radio-indicator" data-slot="radio-indicator" />
    </BaseRadio.Root>
  );
}
