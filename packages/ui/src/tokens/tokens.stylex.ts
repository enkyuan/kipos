import * as stylex from "@stylexjs/stylex";
import { palette } from "./palette.stylex";

/**
 * coss/ui's base theme as StyleX tokens. Names follow coss's CSS variables
 * (`--muted-foreground` → `color.mutedForeground`) so a coss component's
 * classes translate one-to-one. Dark values follow the system preference;
 * coss's `.dark` class becomes `@media (prefers-color-scheme: dark)`.
 */

const DARK = "@media (prefers-color-scheme: dark)";

const darkBackground = `color-mix(in srgb, ${palette.neutral950} 96%, ${palette.white})`;

export const color = stylex.defineVars({
  background: { default: palette.white, [DARK]: darkBackground },
  foreground: { default: palette.neutral800, [DARK]: palette.neutral100 },
  card: {
    default: palette.white,
    [DARK]: `color-mix(in srgb, ${darkBackground} 98%, ${palette.white})`,
  },
  cardForeground: { default: palette.neutral800, [DARK]: palette.neutral100 },
  popover: {
    default: palette.white,
    [DARK]: `color-mix(in srgb, ${darkBackground} 96%, ${palette.white})`,
  },
  popoverForeground: { default: palette.neutral800, [DARK]: palette.neutral100 },
  primary: { default: palette.neutral800, [DARK]: palette.neutral100 },
  primaryForeground: { default: palette.neutral50, [DARK]: palette.neutral800 },
  secondary: { default: "oklch(0 0 0 / 4%)", [DARK]: "oklch(1 0 0 / 4%)" },
  secondaryForeground: { default: palette.neutral800, [DARK]: palette.neutral100 },
  muted: { default: "oklch(0 0 0 / 4%)", [DARK]: "oklch(1 0 0 / 4%)" },
  mutedForeground: {
    default: `color-mix(in srgb, ${palette.neutral500} 90%, ${palette.black})`,
    [DARK]: `color-mix(in srgb, ${palette.neutral500} 90%, ${palette.white})`,
  },
  accent: { default: "oklch(0 0 0 / 4%)", [DARK]: "oklch(1 0 0 / 4%)" },
  accentForeground: { default: palette.neutral800, [DARK]: palette.neutral100 },
  destructive: {
    default: palette.red500,
    [DARK]: `color-mix(in srgb, ${palette.red500} 90%, ${palette.white})`,
  },
  destructiveForeground: { default: palette.red700, [DARK]: palette.red400 },
  info: palette.blue500,
  infoForeground: { default: palette.blue700, [DARK]: palette.blue400 },
  success: palette.emerald500,
  successForeground: { default: palette.emerald700, [DARK]: palette.emerald400 },
  warning: palette.amber500,
  warningForeground: { default: palette.amber700, [DARK]: palette.amber400 },
  border: { default: "oklch(0 0 0 / 8%)", [DARK]: "oklch(1 0 0 / 6%)" },
  input: { default: "oklch(0 0 0 / 10%)", [DARK]: "oklch(1 0 0 / 8%)" },
  ring: { default: palette.neutral400, [DARK]: palette.neutral500 },
  // The 1px highlight coss draws on raised surfaces (`before:shadow-*`):
  // a shade under the top edge in light, a light line above it in dark.
  highlight: { default: `0 1px oklch(0 0 0 / 4%)`, [DARK]: `0 -1px oklch(1 0 0 / 6%)` },
  // Filled buttons: a light inner top edge at rest, a dark one when pressed.
  insetLight: `inset 0 1px oklch(1 0 0 / 16%)`,
  insetDark: `inset 0 1px oklch(0 0 0 / 8%)`,
  white: palette.white,

  // Brand roles from the optimus palette (palette.stylex.ts). Pairs are
  // chosen for WCAG AA text contrast: brandText on background 6.3:1 (light)
  // and 8.2:1 (dark); brandForeground on brand 6.7:1.
  brand: palette.darkSalmon400,
  brandForeground: palette.neutral800,
  brandText: { default: palette.darkSalmon700, [DARK]: palette.darkSalmon300 },
  // Tinted page bands: lavender blush in light, a deep dusty rose in dark.
  brandSurface: { default: palette.lavenderBlush50, [DARK]: palette.lavenderBlush950 },
  brandSurfaceStrong: { default: palette.lightPink100, [DARK]: palette.lightPink950 },
});

/** coss `--radius` (0.625rem) and the steps Tailwind derives from it. */
export const radius = stylex.defineVars({
  sm: "calc(0.625rem - 4px)",
  md: "calc(0.625rem - 2px)",
  lg: "0.625rem",
  xl: "calc(0.625rem + 4px)",
  xxl: "1rem",
  full: "9999px",
});

/**
 * Brand pairing (docs/decisions/0002-brand-typography-and-palette.md):
 * EB Garamond sets headings and the wordmark; Inter sets everything else.
 * Code falls back to the system monospace, so the brand ships two families.
 */
export const font = stylex.defineVars({
  sans: "'Inter Variable', ui-sans-serif, system-ui, sans-serif",
  heading: "'EB Garamond Variable', ui-serif, Georgia, serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
});

/** The brand guide's EB Garamond setting: "Spacing -2" (−2%). */
export const tracking = stylex.defineConsts({
  heading: "-0.02em",
});

/** Tailwind's spacing scale by step name: `p-6` → `space.s6`, `px-2.5` → `space.s2_5`. */
export const space = stylex.defineConsts({
  s0_5: "0.125rem",
  s1: "0.25rem",
  s1_5: "0.375rem",
  s2: "0.5rem",
  s2_5: "0.625rem",
  s3: "0.75rem",
  s3_5: "0.875rem",
  s4: "1rem",
  s5: "1.25rem",
  s6: "1.5rem",
  s8: "2rem",
  s10: "2.5rem",
  s12: "3rem",
  s16: "4rem",
  s20: "5rem",
  s24: "6rem",
});

/** Tailwind's type scale (`text-sm` → `fontSize.sm`, with `lineHeight.sm`). */
export const fontSize = stylex.defineConsts({
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  xxl: "1.5rem",
  xxxl: "1.875rem",
  display: "clamp(2.25rem, 1.5rem + 3vw, 3.75rem)",
});

export const lineHeight = stylex.defineConsts({
  none: "1",
  tight: "1.15",
  xs: "calc(1 / 0.75)",
  sm: "calc(1.25 / 0.875)",
  base: "1.5",
  relaxed: "1.625",
});

export const fontWeight = stylex.defineConsts({
  regular: "400",
  medium: "500",
  semibold: "600",
});

export const shadow = stylex.defineConsts({
  // Tailwind `shadow-xs/5`.
  xs: "0 1px 2px 0 oklch(0 0 0 / 5%)",
  // Tailwind `shadow-lg/5`: raised overlays.
  lg: "0 10px 15px -3px oklch(0 0 0 / 5%), 0 4px 6px -4px oklch(0 0 0 / 5%)",
  // Focus: `ring-2 ring-ring ring-offset-1 ring-offset-background`.
  focusOffset: "1px",
  focusWidth: "3px",
});

export const motion = stylex.defineConsts({
  fast: "150ms",
  ease: "cubic-bezier(0.4, 0, 0.2, 1)",
  // Entrances and exits: moves at once, then settles. Built-in `ease-out`
  // starts too slowly to read as a response to the click.
  easeOut: "cubic-bezier(0.23, 1, 0.32, 1)",
  // Press feedback: the pressed control shrinks this much.
  press: "0.96",
});

export const media = stylex.defineConsts({
  // Tailwind's `sm:` breakpoint: coss controls shrink on wider screens.
  sm: "@media (min-width: 40rem)",
  md: "@media (min-width: 48rem)",
  lg: "@media (min-width: 64rem)",
  hover: "@media (hover: hover)",
  dark: "@media (prefers-color-scheme: dark)",
  reducedMotion: "@media (prefers-reduced-motion: reduce)",
});
