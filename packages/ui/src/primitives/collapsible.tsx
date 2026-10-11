import * as stylex from "@stylexjs/stylex";
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import type { ReactElement } from "react";
import { media, motion } from "../tokens/tokens.stylex";

// coss collapsible. The panel animates its height between 0 and Base UI's
// measured `--collapsible-panel-height`; coss's 200ms becomes the strong
// ease-out, and reduced motion opens it at once.

const STARTING = ":is([data-starting-style])";
const ENDING = ":is([data-ending-style])";

const styles = stylex.create({
  panel: {
    height: { default: "var(--collapsible-panel-height)", [STARTING]: 0, [ENDING]: 0 },
    overflow: "hidden",
    transitionProperty: "height",
    transitionDuration: { default: "200ms", [media.reducedMotion]: "0s" },
    transitionTimingFunction: motion.easeOut,
  },
});

type Unstyled<P> = Omit<P, "className" | "style"> & { xstyle?: stylex.StyleXStyles };

/** `import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@ouro/ui/collapsible"`. */
export function Collapsible({
  xstyle,
  ...props
}: Unstyled<BaseCollapsible.Root.Props>): ReactElement {
  return <BaseCollapsible.Root data-slot="collapsible" {...stylex.props(xstyle)} {...props} />;
}

export function CollapsibleTrigger({
  xstyle,
  ...props
}: Unstyled<BaseCollapsible.Trigger.Props>): ReactElement {
  return (
    <BaseCollapsible.Trigger data-slot="collapsible-trigger" {...stylex.props(xstyle)} {...props} />
  );
}

export function CollapsiblePanel({
  xstyle,
  ...props
}: Unstyled<BaseCollapsible.Panel.Props>): ReactElement {
  return (
    <BaseCollapsible.Panel
      data-slot="collapsible-panel"
      {...stylex.props(styles.panel, xstyle)}
      {...props}
    />
  );
}
