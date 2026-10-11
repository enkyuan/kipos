import * as stylex from "@stylexjs/stylex";
import { Separator as BaseSeparator } from "@base-ui/react/separator";
import type { ReactElement } from "react";
import { color } from "../tokens/tokens.stylex";

const styles = stylex.create({
  base: { flexShrink: 0, borderWidth: 0, backgroundColor: color.border },
  horizontal: { width: "100%", height: "1px" },
  vertical: { width: "1px", alignSelf: "stretch" },
});

export type SeparatorProps = Omit<BaseSeparator.Props, "className" | "style"> & {
  xstyle?: stylex.StyleXStyles;
};

/** `import { Separator } from "@ouro/ui/separator"`. A 1px hairline in the border color. */
export function Separator({
  orientation = "horizontal",
  xstyle,
  ...props
}: SeparatorProps): ReactElement {
  return (
    <BaseSeparator
      {...stylex.props(styles.base, styles[orientation], xstyle)}
      data-slot="separator"
      orientation={orientation}
      {...props}
    />
  );
}
