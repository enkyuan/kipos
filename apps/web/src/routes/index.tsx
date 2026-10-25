import * as stylex from "@stylexjs/stylex";
import { createFileRoute } from "@tanstack/react-router";
import { color, font, fontSize, fontWeight, tracking } from "@nomi/ui/tokens.stylex";
import { PageFrame } from "#features/page-frame/page-frame";

const styles = stylex.create({
  title: {
    fontFamily: font.heading,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.medium,
    letterSpacing: tracking.heading,
  },
  tagline: { color: color.mutedForeground },
});

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <PageFrame>
      <h1 {...stylex.props(styles.title)}>Nomi</h1>
      <p {...stylex.props(styles.tagline)}>A Grok bot for students.</p>
    </PageFrame>
  );
}
