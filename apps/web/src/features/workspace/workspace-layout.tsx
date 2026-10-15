import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { color, font, fontSize, fontWeight, media, space, tracking } from "@kipos/ui/tokens.stylex";
import type { ReactNode } from "react";

const styles = stylex.create({
  header: {
    display: "flex",
    alignItems: "baseline",
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
  narrow: { maxWidth: "48rem" },
  wide: { maxWidth: "80rem" },
  main: {
    display: "flex",
    flexDirection: "column",
    gap: space.s6,
    marginInline: "auto",
    paddingBottom: space.s16,
    paddingInline: { default: space.s4, [media.sm]: space.s6 },
  },
});

/**
 * The FDE workspace frame: the wordmark and a centered column of work,
 * `wide` for pages with a side panel.
 */
export function WorkspaceLayout({
  children,
  width = "narrow",
}: {
  children: ReactNode;
  width?: "narrow" | "wide";
}) {
  return (
    <>
      <header {...stylex.props(styles.header, styles[width])}>
        <Link to="/" {...stylex.props(styles.wordmark)}>
          kipos
        </Link>
      </header>
      <main {...stylex.props(styles.main, styles[width])}>{children}</main>
    </>
  );
}
