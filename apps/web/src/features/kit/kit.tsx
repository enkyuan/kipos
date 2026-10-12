import * as stylex from "@stylexjs/stylex";
import { Blobatar } from "@blobatar/react";
import { Button, type ButtonVariant } from "@ouro/ui/button";
import {
  color,
  font,
  fontSize,
  fontWeight,
  lineHeight,
  space,
  tracking,
} from "@ouro/ui/tokens.stylex";
import { ArrowRightIcon, PlusIcon, ShuffleIcon, SparklesIcon } from "blode-icons-react";
import { useDialKit, type TransitionConfig } from "dialkit";
import { AnimatePresence, MotionConfig, motion, type Transition } from "motion/react";
import { useState } from "react";

// The starting surface: every design primitive the scaffold ships, in use,
// so a new screen starts from working examples. DialKit's controls appear in
// the development panel (dev-tools.tsx); in builds they keep their defaults.

const styles = stylex.create({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.s12,
    maxWidth: "40rem",
    marginInline: "auto",
    paddingBlock: space.s20,
    paddingInline: space.s6,
  },
  wordmark: {
    fontFamily: font.heading,
    fontSize: fontSize.display,
    fontWeight: fontWeight.medium,
    letterSpacing: tracking.heading,
    lineHeight: lineHeight.tight,
  },
  lede: { marginTop: space.s3, fontSize: fontSize.lg, color: color.mutedForeground },
  section: { display: "flex", flexDirection: "column", gap: space.s4 },
  heading: {
    fontFamily: font.heading,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.medium,
    letterSpacing: tracking.heading,
  },
  row: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: space.s2 },
  code: { fontFamily: font.mono, fontSize: fontSize.sm, color: color.mutedForeground },
});

// DialKit's transition editor switches between spring and cubic-bezier
// easing; Motion spells the easing form as a tween.
function toMotion(config: TransitionConfig): Transition {
  return config.type === "easing" ? { duration: config.duration, ease: config.ease } : config;
}

const VARIANTS: ButtonVariant[] = ["default", "outline", "secondary", "ghost", "link"];
const PEOPLE = ["ada", "grace", "linus", "margaret", "alan"];

export function Kit() {
  const dial = useDialKit("Kit", {
    avatarSize: [48, 24, 96, 4],
    entrance: { type: "spring", visualDuration: 0.35, bounce: 0.25 },
  });
  return (
    <MotionConfig reducedMotion="user" transition={toMotion(dial.entrance)}>
      <main {...stylex.props(styles.page)}>
        <header>
          <h1 {...stylex.props(styles.wordmark)}>Ouro</h1>
          <p {...stylex.props(styles.lede)}>An AI copilot for Forward Deployed Engineers.</p>
        </header>
        <Buttons />
        <People size={dial.avatarSize} />
      </main>
    </MotionConfig>
  );
}

function Buttons() {
  return (
    <section aria-labelledby="kit-buttons" {...stylex.props(styles.section)}>
      <h2 id="kit-buttons" {...stylex.props(styles.heading)}>
        Buttons
      </h2>
      <div {...stylex.props(styles.row)}>
        {VARIANTS.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant === "default" ? <SparklesIcon /> : null}
            {variant}
          </Button>
        ))}
        <Button variant="outline" size="icon" aria-label="Add">
          <PlusIcon />
        </Button>
        <Button loading>Saving</Button>
      </div>
      <code {...stylex.props(styles.code)}>{'import { Button } from "@ouro/ui/button"'}</code>
    </section>
  );
}

function People({ size }: { size: number }) {
  const [round, setRound] = useState(0);
  return (
    <section aria-labelledby="kit-people" {...stylex.props(styles.section)}>
      <h2 id="kit-people" {...stylex.props(styles.heading)}>
        People
      </h2>
      <div {...stylex.props(styles.row)}>
        <AnimatePresence mode="popLayout" initial={false}>
          {PEOPLE.map((name) => `${name}-${round}`).map((seed) => (
            <motion.div
              key={seed}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
            >
              <Blobatar name={seed} size={size} title={seed} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div {...stylex.props(styles.row)}>
        <Button variant="outline" onClick={() => setRound((n) => n + 1)}>
          <ShuffleIcon />
          Shuffle
        </Button>
        <Button variant="ghost" nativeButton={false} render={<a href="https://blobatar.dev" />}>
          Blobatar
          <ArrowRightIcon />
        </Button>
      </div>
    </section>
  );
}
