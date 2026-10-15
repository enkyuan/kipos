import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { color, font, fontSize, fontWeight, media, space, tracking } from "@kipos/ui/tokens.stylex";
import type { ReactNode } from "react";

const styles = stylex.create({
  header: {
    display: "flex",
    alignItems: "baseline",
    maxWidth: "48rem",
    marginInline: "auto",
    paddingBlock: space.s5,
    paddingInline: { default: space.s4, [media.sm]: space.s6 },
  },
  wordmark: {
    color: color.foreground,
    fontFamily: font.heading,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.medium,
    letterSpacing: tracking.heading,
    textDecoration: "none",
  },
  main: {
    display: "flex",
    flexDirection: "column",
    gap: space.s6,
    maxWidth: "48rem",
    marginInline: "auto",
    paddingBottom: space.s16,
    paddingInline: { default: space.s4, [media.sm]: space.s6 },
  },
});

/** The page frame: the wordmark and a centered column of content. */
export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <header {...stylex.props(styles.header)}>
        <Link to="/" {...stylex.props(styles.wordmark)}>
          kipos
        </Link>
      </header>
      <main {...stylex.props(styles.main)}>{children}</main>
    </>
  );
}
