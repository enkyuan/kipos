import { describe, expect, test } from "bun:test";
import { join } from "node:path";

// StyleX tokens throw when imported outside the compiler, so these read the
// token sources as text and fail loudly on any entry they cannot resolve.
const tokensDir = join(import.meta.dir, "../src/tokens");
const tokensSource = await Bun.file(join(tokensDir, "tokens.stylex.ts")).text();
const paletteSource = await Bun.file(join(tokensDir, "palette.stylex.ts")).text();

// The `{ ... }` object passed to `export const <name> = stylex.define...`.
function group(source: string, name: string): string {
  const body = source.match(
    new RegExp(`export const ${name} = stylex\\.define\\w+\\(\\{([^]*?)\\n\\}\\);`),
  );
  if (!body?.[1]) throw new Error(`no token group "${name}"`);
  return body[1];
}

// One-line `key: value,` entries; multi-line entries are skipped and so
// cannot be resolved below.
function entries(body: string): Map<string, string> {
  const found = body.matchAll(/^\s*(\w+):\s*(.+?),$/gm);
  return new Map([...found].map(([, key, value]) => [key ?? "", value ?? ""]));
}

const palette = entries(group(paletteSource, "palette"));
const roles = entries(group(tokensSource, "color"));

function paletteValue(reference: string): string {
  const value = palette.get(reference.replace(/^palette\./, ""))?.replaceAll('"', "");
  if (!value?.startsWith("oklch(")) throw new Error(`cannot resolve ${reference}`);
  return value;
}

// A role's light and dark OKLCH values.
function role(name: string): { light: string; dark: string } {
  const value = roles.get(name);
  const themed = value?.match(/^\{ default: (palette\.\w+), \[DARK\]: (palette\.\w+) \}$/);
  if (themed?.[1] && themed[2]) {
    return { light: paletteValue(themed[1]), dark: paletteValue(themed[2]) };
  }
  if (value?.match(/^palette\.\w+$/))
    return { light: paletteValue(value), dark: paletteValue(value) };
  throw new Error(`cannot resolve color role "${name}": ${value}`);
}

// OKLCH → linear sRGB (Björn Ottosson's matrices) → WCAG relative luminance.
// OKLab's inverse already yields linear light, so no sRGB transfer curve.
function luminance(oklch: string): number {
  const [l = NaN, c = NaN, h = NaN] = oklch.slice(6, -1).trim().split(/\s+/).map(Number);
  if ([l, c, h].some(Number.isNaN)) throw new Error(`cannot parse ${oklch}`);
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const lc = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mc = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sc = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  const red = clamp(4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc);
  const green = clamp(-1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc);
  const blue = clamp(-0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: string, second: string): number {
  const [high, low] = [luminance(first), luminance(second)].sort((x, y) => y - x);
  return ((high ?? 0) + 0.05) / ((low ?? 0) + 0.05);
}

const PAPER = ["background", "card", "popover"];
const GRAPHITE = ["secondary", "muted", "accent"];
const WASHES = ["brandSurface", "brandSurfaceStrong"];

// The pairs tokens.stylex.ts and ADR 0008 document: text roles need WCAG AA
// for body text (4.5:1); the focus ring and control outlines are non-text UI
// and need 3:1 on the surfaces they sit on.
const PAIRS: { on: string; surfaces: string[]; minimum: number }[] = [
  { on: "foreground", surfaces: [...PAPER, ...GRAPHITE, ...WASHES], minimum: 4.5 },
  { on: "cardForeground", surfaces: ["card"], minimum: 4.5 },
  { on: "popoverForeground", surfaces: ["popover"], minimum: 4.5 },
  { on: "secondaryForeground", surfaces: ["secondary"], minimum: 4.5 },
  { on: "accentForeground", surfaces: ["accent"], minimum: 4.5 },
  { on: "mutedForeground", surfaces: ["background", "muted"], minimum: 4.5 },
  { on: "primaryForeground", surfaces: ["primary"], minimum: 4.5 },
  { on: "brandForeground", surfaces: ["brand"], minimum: 4.5 },
  { on: "brandText", surfaces: ["background", "brandSurface"], minimum: 4.5 },
  { on: "white", surfaces: ["destructive"], minimum: 4.5 },
  { on: "ring", surfaces: [...PAPER, ...GRAPHITE, ...WASHES], minimum: 3 },
  { on: "input", surfaces: PAPER, minimum: 3 },
];

describe("color roles", () => {
  // Each documented role pair meets WCAG (text 4.5:1, focus ring and control outlines 3:1) in both
  // themes. Fails when a retheme or palette tweak drops a pair below its minimum.
  test("meets its WCAG minimum on every surface it pairs with, in both themes", () => {
    const failing: string[] = [];
    for (const { on, surfaces, minimum } of PAIRS) {
      for (const surface of surfaces) {
        for (const theme of ["light", "dark"] as const) {
          const ratio = contrast(role(on)[theme], role(surface)[theme]);
          if (ratio < minimum)
            failing.push(`${on} on ${surface} (${theme}): ${ratio.toFixed(2)}:1`);
        }
      }
    }
    expect(failing).toEqual([]);
  });
});

describe("radius scale", () => {
  // The concentric ladder: a child inset 4px (sm→md) or 6px (above) keeps parallel corners. Fails
  // when one step changes without the rest.
  test("steps up by the documented inset, so nested corners stay parallel", () => {
    const radii = entries(group(tokensSource, "radius"));
    const px = (step: string) => {
      const value = radii.get(step)?.match(/^"([\d.]+)rem"$/)?.[1];
      if (!value) throw new Error(`cannot resolve radius "${step}"`);
      return Number(value) * 16;
    };
    const ladder = ["sm", "md", "lg", "xl", "xxl"];
    const insets = ladder.slice(1).map((step, index) => px(step) - px(ladder[index] ?? ""));
    expect(insets).toEqual([4, 6, 6, 6]);
  });
});
