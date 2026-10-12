import * as stylex from "@stylexjs/stylex";

/**
 * Primitive colors, as OKLCH. Only `tokens.stylex.ts` reads these;
 * components consume semantic roles.
 *
 * - Warm neutrals (paper, graphite, ink): hue 50–60 at chroma ≤ 0.006, so
 *   greys sit beside peach instead of reading blue. Named by lightness × 1000.
 * - Brand (docs/decisions/0008-notebook-design-system.md): peach for action,
 *   petal for the character's colour. The pale washes sit at 95% of the sRGB
 *   chroma limit for their lightness, so they never clip.
 * - Tailwind v4 status shades for destructive, info, success and warning.
 */
export const palette = stylex.defineConsts({
  white: "oklch(1 0 0)",
  black: "oklch(0 0 0)",

  warm955: "oklch(0.955 0.003 60)",
  warm950: "oklch(0.95 0.003 60)",
  warm920: "oklch(0.92 0.004 60)",
  warm760: "oklch(0.76 0.005 60)",
  warm660: "oklch(0.66 0.006 60)",
  warm520: "oklch(0.52 0.006 50)",
  warm470: "oklch(0.47 0.006 50)",
  warm280: "oklch(0.28 0.005 50)",
  warm240: "oklch(0.24 0.005 50)",
  warm205: "oklch(0.205 0.006 50)",
  warm200: "oklch(0.2 0.006 50)",
  warm165: "oklch(0.165 0.004 50)",

  peach: "oklch(0.835 0.098 52)",
  peachDark: "oklch(0.81 0.1 52)",
  peachWash: "oklch(0.955 0.028 60)",
  peachWashDark: "oklch(0.275 0.035 52)",
  // Peach as text or a mark: terracotta by day, light peach at night.
  peachInk: "oklch(0.51 0.13 42)",
  peachInkDark: "oklch(0.83 0.1 55)",
  // Text on peach in both themes. White on peach is 1.7:1.
  onPeach: "oklch(0.24 0.03 40)",
  petalWash: "oklch(0.93 0.035 8)",
  petalWashDark: "oklch(0.32 0.05 8)",

  red400: "oklch(0.704 0.191 22.216)",
  red500: "oklch(0.637 0.237 25.331)",
  red600: "oklch(0.577 0.245 27.325)",
  red700: "oklch(0.505 0.213 27.518)",
  blue400: "oklch(0.707 0.165 254.624)",
  blue500: "oklch(0.623 0.214 259.815)",
  blue700: "oklch(0.488 0.243 264.376)",
  emerald400: "oklch(0.765 0.177 163.223)",
  emerald500: "oklch(0.696 0.17 162.48)",
  emerald700: "oklch(0.508 0.118 165.612)",
  amber400: "oklch(0.828 0.189 84.429)",
  amber500: "oklch(0.769 0.188 70.08)",
  amber700: "oklch(0.555 0.163 48.998)",
});
