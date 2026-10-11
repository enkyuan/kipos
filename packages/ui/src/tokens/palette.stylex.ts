import * as stylex from "@stylexjs/stylex";

/**
 * Primitive colors, as OKLCH. Only `tokens.stylex.ts` reads these;
 * components consume semantic roles.
 *
 * - Tailwind v4 shades: the ones coss/ui's base theme is built from.
 * - Brand ramps: the optimus brand guide's primary palette, each named by its
 *   nearest CSS named color. The brand swatch itself sits unchanged at the
 *   step nearest its lightness (marked below); the other steps keep its hue
 *   and its share of the in-gamut chroma at each lightness. Lavender blush is
 *   a near-white tint, so its darker steps cap chroma at 0.06 to stay dusty
 *   rather than turning magenta.
 */
export const palette = stylex.defineConsts({
  white: "oklch(1 0 0)",
  black: "oklch(0 0 0)",
  neutral50: "oklch(0.985 0 0)",
  neutral100: "oklch(0.97 0 0)",
  neutral400: "oklch(0.708 0 0)",
  neutral500: "oklch(0.556 0 0)",
  neutral800: "oklch(0.269 0 0)",
  neutral950: "oklch(0.145 0 0)",
  red400: "oklch(0.704 0.191 22.216)",
  red500: "oklch(0.637 0.237 25.331)",
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

  // Dark salmon: #eb9a6b is darkSalmon400
  darkSalmon50: "oklch(0.971 0.012 50.414)",
  darkSalmon100: "oklch(0.936 0.026 50.414)",
  darkSalmon200: "oklch(0.885 0.049 50.414)",
  darkSalmon300: "oklch(0.81 0.086 50.414)",
  darkSalmon400: "oklch(0.757 0.116 50.414)",
  darkSalmon500: "oklch(0.655 0.124 50.414)",
  darkSalmon600: "oklch(0.575 0.109 50.414)",
  darkSalmon700: "oklch(0.495 0.094 50.414)",
  darkSalmon800: "oklch(0.415 0.079 50.414)",
  darkSalmon900: "oklch(0.345 0.065 50.414)",
  darkSalmon950: "oklch(0.265 0.05 50.414)",

  // Light pink: #eeb2b2 is lightPink300
  lightPink50: "oklch(0.971 0.01 18.696)",
  lightPink100: "oklch(0.936 0.022 18.696)",
  lightPink200: "oklch(0.885 0.042 18.696)",
  lightPink300: "oklch(0.819 0.07 18.696)",
  lightPink400: "oklch(0.735 0.112 18.696)",
  lightPink500: "oklch(0.655 0.16 18.696)",
  lightPink600: "oklch(0.575 0.159 18.696)",
  lightPink700: "oklch(0.495 0.137 18.696)",
  lightPink800: "oklch(0.415 0.115 18.696)",
  lightPink900: "oklch(0.345 0.095 18.696)",
  lightPink950: "oklch(0.265 0.073 18.696)",

  // Lavender blush: #ffeef4 is lavenderBlush50
  lavenderBlush50: "oklch(0.964 0.02 353.985)",
  lavenderBlush100: "oklch(0.936 0.036 353.985)",
  lavenderBlush200: "oklch(0.885 0.06 353.985)",
  lavenderBlush300: "oklch(0.81 0.06 353.985)",
  lavenderBlush400: "oklch(0.735 0.06 353.985)",
  lavenderBlush500: "oklch(0.655 0.06 353.985)",
  lavenderBlush600: "oklch(0.575 0.06 353.985)",
  lavenderBlush700: "oklch(0.495 0.06 353.985)",
  lavenderBlush800: "oklch(0.415 0.06 353.985)",
  lavenderBlush900: "oklch(0.345 0.06 353.985)",
  lavenderBlush950: "oklch(0.265 0.06 353.985)",
});
