import * as stylex from "@stylexjs/stylex";
import { Badge } from "@ouro/ui/badge";
import {
  color,
  font,
  fontSize,
  fontWeight,
  lineHeight,
  space,
  tracking,
} from "@ouro/ui/tokens.stylex";
import type { ReactNode } from "react";
import { layout } from "./layout";

const styles = stylex.create({
  // The brand guide's logo-usage tiles: a soft lavender-blush wash that
  // settles into the page.
  band: {
    backgroundImage: `linear-gradient(180deg, ${color.brandSurface}, ${color.background})`,
  },
  hero: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: space.s6,
    paddingBlock: `${space.s16} ${space.s20}`,
    scrollMarginTop: space.s8,
  },
  badge: { backgroundColor: color.brandSurfaceStrong, color: color.brandText },
  title: {
    maxWidth: "16ch",
    fontFamily: font.heading,
    fontSize: fontSize.display,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.tight,
    letterSpacing: tracking.heading,
    textWrap: "balance",
  },
  lede: {
    maxWidth: "40rem",
    color: color.mutedForeground,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.relaxed,
    textWrap: "pretty",
  },
});

type HeroProps = {
  /** The page's call to action, supplied by the route that composes the page. */
  children: ReactNode;
};

// Placeholder copy: replace it once docs/product.md says what Ouro is.
export function Hero({ children }: HeroProps) {
  return (
    <div {...stylex.props(styles.band)}>
      <section
        id="waitlist"
        aria-labelledby="hero-title"
        {...stylex.props(layout.container, styles.hero)}
      >
        <Badge xstyle={styles.badge}>In development</Badge>
        <h1 id="hero-title" {...stylex.props(styles.title)}>
          Build in tight loops.
        </h1>
        <p {...stylex.props(styles.lede)}>
          Ouro is taking shape. Leave your email and we'll tell you when it's ready to try.
        </p>
        {children}
      </section>
    </div>
  );
}
