/**
 * Generates src/styles/scales.css: Radix-style 12-step scales as CSS
 * variables, for light, dark, and the system preference. Run `bun run palette`
 * in packages/ui after changing a ladder; test/tokens.test.ts fails when
 * scales.css is out of date.
 *
 * Solids are OKLCH [lightness, chroma] pairs at one hue per scale, so a hue
 * change is one number. Alpha steps are derived, not authored: each is the
 * most transparent color that composites to its solid over the mode's page,
 * so one role works on any surface. Step 9 is the solid and is the same in
 * both modes, 10 its hover, 11 low-contrast text, 12 high-contrast text.
 * Browsers gamut-map OKLCH, so wide-gamut displays get the full color with no
 * separate Display P3 block.
 */

type Ladder = { l: number[]; c: number[] };
type Scale = { hue: number; light: Ladder; dark: Ladder };

// Fill steps 1-8 stay pale and soft; the solids (step 9) sit deep enough that
// white text clears AA. The brand swatch (dark salmon) is step 8.
const scales: Record<string, Scale> = {
  gray: {
    hue: 0,
    light: {
      l: [0.992, 0.982, 0.958, 0.936, 0.914, 0.89, 0.86, 0.79, 0.55, 0.5, 0.42, 0.22],
      c: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    dark: {
      l: [0.17, 0.205, 0.245, 0.278, 0.31, 0.348, 0.405, 0.485, 0.64, 0.7, 0.82, 0.94],
      c: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  },
  brand: {
    hue: 50.4,
    light: {
      l: [0.99, 0.971, 0.944, 0.914, 0.882, 0.841, 0.795, 0.757, 0.525, 0.48, 0.41, 0.26],
      c: [0, 0.002, 0.008, 0.017, 0.032, 0.054, 0.081, 0.116, 0.138, 0.126, 0.081, 0.021],
    },
    dark: {
      l: [0.165, 0.195, 0.24, 0.275, 0.31, 0.35, 0.4, 0.46, 0.525, 0.68, 0.84, 0.95],
      c: [0.005, 0.009, 0.019, 0.027, 0.036, 0.046, 0.061, 0.08, 0.138, 0.138, 0.074, 0.007],
    },
  },
  positive: {
    hue: 160,
    light: {
      l: [0.99, 0.955, 0.905, 0.85, 0.79, 0.715, 0.63, 0.56, 0.49, 0.445, 0.41, 0.26],
      c: [0.001, 0.008, 0.039, 0.067, 0.08, 0.089, 0.088, 0.089, 0.089, 0.089, 0.07, 0.018],
    },
    dark: {
      l: [0.165, 0.195, 0.24, 0.275, 0.31, 0.35, 0.4, 0.46, 0.49, 0.68, 0.84, 0.95],
      c: [0.004, 0.008, 0.016, 0.024, 0.031, 0.04, 0.052, 0.069, 0.089, 0.089, 0.089, 0.019],
    },
  },
  warning: {
    hue: 82,
    light: {
      l: [0.99, 0.956, 0.907, 0.853, 0.794, 0.72, 0.637, 0.569, 0.5, 0.455, 0.41, 0.26],
      c: [0.001, 0.005, 0.023, 0.052, 0.074, 0.082, 0.081, 0.082, 0.082, 0.082, 0.063, 0.016],
    },
    dark: {
      l: [0.165, 0.195, 0.24, 0.275, 0.31, 0.35, 0.4, 0.46, 0.5, 0.68, 0.84, 0.95],
      c: [0.004, 0.007, 0.015, 0.022, 0.028, 0.036, 0.048, 0.063, 0.082, 0.082, 0.082, 0.012],
    },
  },
  danger: {
    hue: 24,
    light: {
      l: [0.99, 0.956, 0.907, 0.853, 0.794, 0.72, 0.637, 0.569, 0.5, 0.455, 0.41, 0.26],
      c: [0, 0.003, 0.012, 0.028, 0.053, 0.096, 0.154, 0.166, 0.172, 0.172, 0.124, 0.032],
    },
    dark: {
      l: [0.165, 0.195, 0.24, 0.275, 0.31, 0.35, 0.4, 0.46, 0.5, 0.68, 0.84, 0.95],
      c: [0.008, 0.014, 0.029, 0.042, 0.055, 0.071, 0.094, 0.123, 0.172, 0.172, 0.066, 0.006],
    },
  },
  info: {
    hue: 245,
    light: {
      l: [0.99, 0.955, 0.905, 0.85, 0.79, 0.715, 0.63, 0.56, 0.49, 0.445, 0.41, 0.26],
      c: [0, 0.003, 0.012, 0.028, 0.051, 0.088, 0.098, 0.099, 0.099, 0.099, 0.077, 0.02],
    },
    dark: {
      l: [0.165, 0.195, 0.24, 0.275, 0.31, 0.35, 0.4, 0.46, 0.49, 0.68, 0.84, 0.95],
      c: [0.005, 0.009, 0.018, 0.026, 0.034, 0.044, 0.058, 0.076, 0.099, 0.099, 0.064, 0.006],
    },
  },
};

type Rgb = [number, number, number];

export const toGamma = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const clamp = (c: number) => Math.min(1, Math.max(0, c));

export function oklchToRgb(L: number, C: number, hue: number): Rgb {
  const a = C * Math.cos((hue * Math.PI) / 180);
  const b = C * Math.sin((hue * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ].map(clamp) as Rgb;
}

function rgbToOklch([r, g, b]: Rgb): [number, number, number] {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b2 = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.hypot(a, b2);
  const hue = chroma < 1e-4 ? 0 : ((Math.atan2(b2, a) * 180) / Math.PI + 360) % 360;
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, chroma, hue];
}

/** The pages the alpha steps are derived against: white, and the dark `--color-page`. */
const pages: Record<"light" | "dark", Rgb> = { light: [1, 1, 1], dark: oklchToRgb(0.15, 0, 0) };

const num = (value: number, digits: number) => String(Number(value.toFixed(digits)));
const oklch = ([L, C, H]: readonly [number, number, number], alpha?: number) =>
  `oklch(${num(L, 3)} ${num(C, 3)} ${num(C < 5e-4 ? 0 : H, 1)}${alpha === undefined ? "" : ` / ${num(alpha, 3)}`})`;

/** The most transparent color that composites to `solid` over `page`. */
function overlay(solid: Rgb, page: Rgb): string {
  // fg = page + (solid - page) / alpha must stay inside [0, 1] per channel.
  const alpha = Math.max(
    ...solid.map((c, i) => {
      const p = page[i]!;
      return c >= p ? (c - p) / (1 - p) : (p - c) / p;
    }),
  );
  if (alpha < 5e-4) return oklch([0, 0, 0], 0);
  const fg = solid.map((c, i) => clamp(page[i]! + (c - page[i]!) / alpha)) as Rgb;
  return oklch(rgbToOklch(fg), alpha);
}

function modeVariables(mode: "light" | "dark"): string[] {
  const lines: string[] = [];
  for (const [name, { hue, light, dark }] of Object.entries(scales)) {
    const { l, c } = mode === "light" ? light : dark;
    l.forEach((L, i) => lines.push(`--${name}-${i + 1}: ${oklch([L, c[i]!, hue])};`));
    l.forEach((L, i) => {
      lines.push(`--${name}-a${i + 1}: ${overlay(oklchToRgb(L, c[i]!, hue), pages[mode])};`);
    });
  }
  return lines;
}

// Radix's black and white overlays (5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90,
// 95%) are the same in both modes, so only :root declares them.
const overlays = [0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95].flatMap((a, i) => [
  `--black-a${i + 1}: oklch(0 0 0 / ${a});`,
  `--white-a${i + 1}: oklch(1 0 0 / ${a});`,
]);

const block = (selector: string, lines: string[], indent = "") =>
  `${indent}${selector} {\n${lines.map((line) => `${indent}  ${line}`).join("\n")}\n${indent}}`;

export function renderScales(): string {
  const dark = modeVariables("dark");
  return [
    "/* GENERATED by scripts/palette.ts (bun run palette). Do not edit. */",
    block(":root", ["color-scheme: light;", ...modeVariables("light"), ...overlays]),
    "/* The theme classes go on <html>: roles resolve where they are declared. */",
    block(".dark", ["color-scheme: dark;", ...dark]),
    "@media (prefers-color-scheme: dark) {",
    block(":root:not(.light)", ["color-scheme: dark;", ...dark], "  "),
    "}",
    "",
  ].join("\n");
}

if (import.meta.main) {
  const target = new URL("../src/styles/scales.css", import.meta.url);
  await Bun.write(target, renderScales());
  console.info(`wrote ${target.pathname}`);
}
