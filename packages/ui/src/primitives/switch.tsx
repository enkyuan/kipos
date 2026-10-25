import { Switch as BaseSwitch } from "@base-ui/react/switch";
import type { ReactElement } from "react";
import { classes, type Styled } from "./classes";

export type SwitchProps = Styled<BaseSwitch.Root.Props>;

export function Switch({ className, ...props }: SwitchProps): ReactElement {
  return (
    <BaseSwitch.Root {...props} className={classes("nm-switch", className)} data-slot="switch">
      <BaseSwitch.Thumb className="nm-switch-thumb" data-slot="switch-thumb" />
    </BaseSwitch.Root>
  );
}
