import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ReactElement } from "react";
import { classes, type Styled } from "./classes";

export function Tabs(props: Styled<BaseTabs.Root.Props>): ReactElement {
  return <BaseTabs.Root {...props} data-slot="tabs" />;
}

export function TabsList({
  className,
  children,
  ...props
}: Styled<BaseTabs.List.Props>): ReactElement {
  return (
    <BaseTabs.List {...props} className={classes("nm-tabs-list", className)} data-slot="tabs-list">
      {children}
      <BaseTabs.Indicator className="nm-tabs-indicator" data-slot="tabs-indicator" />
    </BaseTabs.List>
  );
}

export function Tab({ className, ...props }: Styled<BaseTabs.Tab.Props>): ReactElement {
  return <BaseTabs.Tab {...props} className={classes("nm-tab", className)} data-slot="tab" />;
}

export function TabsPanel({ className, ...props }: Styled<BaseTabs.Panel.Props>): ReactElement {
  return (
    <BaseTabs.Panel
      {...props}
      className={classes("nm-tabs-panel", className)}
      data-slot="tabs-panel"
    />
  );
}
