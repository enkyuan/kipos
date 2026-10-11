import * as stylex from "@stylexjs/stylex";
import { media, space } from "@ouro/ui/tokens.stylex";

/** The landing page's one column: centered, with coss's container gutters. */
export const layout = stylex.create({
  container: {
    width: "100%",
    maxWidth: "72rem",
    marginInline: "auto",
    paddingInline: { default: space.s4, [media.lg]: space.s6 },
  },
});
