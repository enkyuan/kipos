import * as stylex from "@stylexjs/stylex";
import { Separator } from "@ouro/ui/separator";
import { color, fontSize, space } from "@ouro/ui/tokens.stylex";
import { layout } from "./layout";

const styles = stylex.create({
  footer: { paddingBottom: space.s8 },
  note: { paddingTop: space.s6, color: color.mutedForeground, fontSize: fontSize.sm },
});

export function SiteFooter() {
  return (
    <footer {...stylex.props(layout.container, styles.footer)}>
      <Separator />
      <p {...stylex.props(styles.note)}>© Ouro</p>
    </footer>
  );
}
