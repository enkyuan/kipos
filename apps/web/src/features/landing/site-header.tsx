import * as stylex from "@stylexjs/stylex";
import { Badge } from "@ouro/ui/badge";
import { Button } from "@ouro/ui/button";
import { color, font, fontSize, fontWeight, space, tracking } from "@ouro/ui/tokens.stylex";
import { layout } from "./layout";

const styles = stylex.create({
  bar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBlock: space.s4,
  },
  brand: { display: "flex", alignItems: "center", gap: space.s2 },
  // The brand guide's logotype is set in EB Garamond.
  wordmark: {
    color: color.foreground,
    fontFamily: font.heading,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.medium,
    lineHeight: 1,
    letterSpacing: tracking.heading,
    textDecoration: "none",
  },
});

export function SiteHeader() {
  return (
    <header {...stylex.props(layout.container, styles.bar)}>
      <div {...stylex.props(styles.brand)}>
        <a href="/" {...stylex.props(styles.wordmark)}>
          ouro
        </a>
        <Badge variant="outline">Early access</Badge>
      </div>
      <Button variant="ghost" size="sm" render={<a href="#waitlist" />}>
        Join the waitlist
      </Button>
    </header>
  );
}
