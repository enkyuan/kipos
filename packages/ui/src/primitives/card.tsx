import * as stylex from "@stylexjs/stylex";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { ReactElement } from "react";
import {
  color,
  font,
  fontSize,
  fontWeight,
  lineHeight,
  media,
  radius,
  shadow,
  space,
} from "../tokens/tokens.stylex";

// coss card. coss pads each part p-6 and trims the seams between them with
// sibling selectors (header pb-4, panel pt-0); here the card owns the
// vertical rhythm (block padding 6, gap 4) and the parts pad inline only,
// which renders the same spacing without selectors StyleX cannot express.

const styles = stylex.create({
  card: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: space.s4,
    paddingBlock: space.s6,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.border,
    borderRadius: radius.xxl,
    backgroundColor: color.card,
    backgroundClip: { default: "padding-box", [media.dark]: null },
    color: color.cardForeground,
    boxShadow: shadow.xs,
    "::before": {
      content: "''",
      position: "absolute",
      inset: 0,
      borderRadius: `calc(${radius.xxl} - 1px)`,
      boxShadow: color.highlight,
      pointerEvents: "none",
    },
  },
  header: {
    display: "grid",
    gridAutoRows: "min-content",
    alignItems: "start",
    gap: space.s1_5,
    paddingInline: space.s6,
  },
  title: {
    fontFamily: font.heading,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.none,
  },
  description: {
    color: color.mutedForeground,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  panel: { flexGrow: 1, paddingInline: space.s6 },
  footer: { display: "flex", alignItems: "center", paddingInline: space.s6 },
});

type PartProps = Omit<useRender.ComponentProps<"div">, "className" | "style"> & {
  xstyle?: stylex.StyleXStyles;
};

function useCardPart(part: keyof typeof styles, { render, xstyle, ...props }: PartProps) {
  const ownProps = {
    ...stylex.props(styles[part], xstyle),
    "data-slot": part === "card" ? "card" : `card-${part}`,
  };
  return useRender({ defaultTagName: "div", render, props: mergeProps<"div">(ownProps, props) });
}

/**
 * `import { Card, CardHeader, CardTitle, CardDescription, CardPanel,
 * CardFooter } from "@kipos/ui/card"`. Pass `render={<article />}` for a
 * self-contained item, and `render={<h3 />}` to make a title a heading.
 */
export function Card(props: PartProps): ReactElement {
  return useCardPart("card", props);
}

export function CardHeader(props: PartProps): ReactElement {
  return useCardPart("header", props);
}

export function CardTitle(props: PartProps): ReactElement {
  return useCardPart("title", props);
}

export function CardDescription(props: PartProps): ReactElement {
  return useCardPart("description", props);
}

export function CardPanel(props: PartProps): ReactElement {
  return useCardPart("panel", props);
}

export function CardFooter(props: PartProps): ReactElement {
  return useCardPart("footer", props);
}
