import * as stylex from "@stylexjs/stylex";
import { palette } from "./palette.stylex";

/**
 * The semantic theme as StyleX tokens. Roles follow the common
 * shadcn-style vocabulary (`background`, `mutedForeground`, `ring`, ...), so
 * a reference design's classes translate one-to-one. Dark values follow the
 * system preference (`@media (prefers-color-scheme: dark)`).
 */

const DARK = "@media (prefers-color-scheme: dark)";

/**
 * The 60 / 30 / 10 split (docs/decisions/0008-notebook-design-system.md):
 * paper (`background`, `card`, `popover`) fills most of a view, graphite
 * (`secondary`, `muted`, `accent`) about a third, and colour (`primary`,
 * `brand*`) a tenth. Status colors are signals, outside the split. Every
 * foreground meets WCAG AA on the surfaces paired with it, in both themes.
 */
export const color = stylex.defineVars({
  background: { default: palette.white, [DARK]: palette.warm165 },
  foreground: { default: palette.warm200, [DARK]: palette.warm950 },
  // On white, raised surfaces match the page and separate by shadow; at night
  // they step one shade lighter.
  card: { default: palette.white, [DARK]: palette.warm205 },
  cardForeground: { default: palette.warm200, [DARK]: palette.warm950 },
  popover: { default: palette.white, [DARK]: palette.warm205 },
  popoverForeground: { default: palette.warm200, [DARK]: palette.warm950 },
  // The one colored action per view: peach with dark text (9.73:1 light,
  // 8.94:1 dark).
  primary: { default: palette.peach, [DARK]: palette.peachDark },
  primaryForeground: palette.onPeach,
  secondary: { default: palette.warm955, [DARK]: palette.warm240 },
  secondaryForeground: { default: palette.warm200, [DARK]: palette.warm950 },
  muted: { default: palette.warm955, [DARK]: palette.warm240 },
  // 6.0:1 on `muted` and 6.84:1 on `background` (light); 7.66:1 and 8.97:1 (dark).
  mutedForeground: { default: palette.warm470, [DARK]: palette.warm760 },
  accent: { default: palette.warm955, [DARK]: palette.warm240 },
  accentForeground: { default: palette.warm200, [DARK]: palette.warm950 },
  // White labels read at 4.76:1 in both themes.
  destructive: palette.red600,
  destructiveForeground: { default: palette.red700, [DARK]: palette.red400 },
  info: palette.blue500,
  infoForeground: { default: palette.blue700, [DARK]: palette.blue400 },
  success: palette.emerald500,
  successForeground: { default: palette.emerald700, [DARK]: palette.emerald400 },
  warning: palette.amber500,
  warningForeground: { default: palette.amber700, [DARK]: palette.amber400 },
  border: { default: palette.warm920, [DARK]: palette.warm280 },
  // Field outlines: 3:1 on every surface a field can sit on, paper, graphite
  // and the washes (3.17:1 or better light, 3.15:1 or better dark). Outline
  // buttons are identified by their label and keep the hairline `border`.
  input: { default: palette.warm600, [DARK]: palette.warm590 },
  // Solid, so the focus ring holds 3:1 on every surface: 6.08:1 on
  // `background` (light), 11.14:1 (dark).
  ring: { default: palette.peachInk, [DARK]: palette.peachInkDark },
  // A 1px highlight on raised surfaces (drawn on `::before`):
  // a shade under the top edge in light, a light line above it in dark.
  highlight: { default: `0 1px oklch(0 0 0 / 4%)`, [DARK]: `0 -1px oklch(1 0 0 / 6%)` },
  // Filled buttons: a light inner top edge at rest, a dark one when pressed.
  insetLight: `inset 0 1px oklch(1 0 0 / 16%)`,
  insetDark: `inset 0 1px oklch(0 0 0 / 8%)`,
  white: palette.white,

  brand: { default: palette.peach, [DARK]: palette.peachDark },
  brandForeground: palette.onPeach,
  // Peach as text: 6.08:1 on `background` and 5.31:1 on `brandSurface`
  // (light); 11.14:1 and 8.65:1 (dark).
  brandText: { default: palette.peachInk, [DARK]: palette.peachInkDark },
  // Colour-tier washes: peach for status and success moments, petal for the
  // highlighter mark. `foreground` reads on both at 11:1 or better.
  brandSurface: { default: palette.peachWash, [DARK]: palette.peachWashDark },
  brandSurfaceStrong: { default: palette.petalWash, [DARK]: palette.petalWashDark },
});

/**
 * A concentric ladder: each step is the one below plus the inset between
 * them (4px from sm to md, 6px above), so a child inset by that much keeps
 * its corners parallel to its parent's.
 */
export const radius = stylex.defineVars({
  sm: "0.625rem",
  md: "0.875rem",
  lg: "1.25rem",
  xl: "1.625rem",
  xxl: "2rem",
  full: "9999px",
});

/**
 * Brand pairing (docs/decisions/0008-notebook-design-system.md): Zodiak sets
 * headings and the wordmark; Glide sets everything else, and Glide Mono sets
 * code. base.css declares the faces. Every Zodiak style sets `fontWeight`
 * (400 or 500): headings otherwise take the browser's bold, too heavy for it.
 */
export const font = stylex.defineVars({
  sans: "'Glide', ui-sans-serif, system-ui, sans-serif",
  heading: "'Zodiak', 'Iowan Old Style', Georgia, serif",
  mono: "'Glide Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
});

/** Zodiak's display sizes tighten slightly; it is already compact. */
export const tracking = stylex.defineConsts({
  heading: "-0.01em",
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
  // Tailwind `shadow-lg/5`: raised overlays (toasts).
  lg: "0 10px 15px -3px oklch(0 0 0 / 5%), 0 4px 6px -4px oklch(0 0 0 / 5%)",
  // Focus: a 2px ring at a 2px offset, the offset filled with the page color
  // so the ring separates from any fill it surrounds. `focusWidth` is the
  // ring's outer edge (offset + ring), the spread of the second shadow.
  focusOffset: "2px",
  focusWidth: "4px",
});

/**
 * One duration per interaction, not ranges. Exits are faster than entrances,
 * and anything driven from the keyboard or repeated many times an hour does
 * not animate. 0008 lists the values a new primitive adds here (select,
 * unfold, fold).
 */
export const motion = stylex.defineConsts({
  // Hover and color changes.
  fast: "150ms",
  ease: "cubic-bezier(0.4, 0, 0.2, 1)",
  // Press feedback: the pressed control shrinks to `press` in `pressDuration`.
  press: "0.96",
  pressDuration: "120ms",
  // Entrances, exits and presses: moves at once, then settles. Built-in
  // `ease-out` starts too slowly to read as a response to the click.
  easeOut: "cubic-bezier(0.23, 1, 0.32, 1)",
});

export const media = stylex.defineConsts({
  // Tailwind's `sm:` breakpoint: controls shrink on wider screens.
  sm: "@media (min-width: 40rem)",
  md: "@media (min-width: 48rem)",
  lg: "@media (min-width: 64rem)",
  // Hover only where a fine pointer can hover: a tap never leaves a hover.
  hover: "@media (hover: hover) and (pointer: fine)",
  dark: "@media (prefers-color-scheme: dark)",
  reducedMotion: "@media (prefers-reduced-motion: reduce)",
});
