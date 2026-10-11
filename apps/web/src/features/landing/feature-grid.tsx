import * as stylex from "@stylexjs/stylex";
import { Card, CardDescription, CardHeader, CardTitle } from "@ouro/ui/card";
import { font, fontSize, fontWeight, media, space, tracking } from "@ouro/ui/tokens.stylex";
import { layout } from "./layout";

const styles = stylex.create({
  section: {
    display: "flex",
    flexDirection: "column",
    gap: space.s6,
    paddingBottom: space.s24,
  },
  heading: {
    fontFamily: font.heading,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.medium,
    letterSpacing: tracking.heading,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: { default: "1fr", [media.md]: "repeat(3, 1fr)" },
    gap: space.s4,
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  // Garamond's small x-height reads a step smaller than Inter at the same size.
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
    letterSpacing: tracking.heading,
  },
});

// Placeholder copy: replace it once docs/product.md says what Ouro is.
const features = [
  {
    title: "Fast feedback",
    description: "Every change shows its effect in seconds, not after a release.",
  },
  {
    title: "Small, sharp tools",
    description: "A few primitives that compose, instead of one framework to learn.",
  },
  {
    title: "Shaped with you",
    description: "Early users decide what gets built next. Join the waitlist to have a say.",
  },
] as const;

export function FeatureGrid() {
  return (
    <section aria-labelledby="features-title" {...stylex.props(layout.container, styles.section)}>
      <h2 id="features-title" {...stylex.props(styles.heading)}>
        What to expect
      </h2>
      <ul {...stylex.props(styles.grid)}>
        {features.map((feature) => (
          <Card key={feature.title} render={<li />}>
            <CardHeader>
              <CardTitle render={<h3 />} xstyle={styles.cardTitle}>
                {feature.title}
              </CardTitle>
              <CardDescription render={<p />}>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </ul>
    </section>
  );
}
