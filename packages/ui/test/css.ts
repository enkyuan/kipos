import { readFileSync } from "node:fs";
import { join } from "node:path";

// Reads the design system's stylesheets as data, so tests judge the files
// that ship and not a copy of their values.

const styles = join(import.meta.dir, "../src/styles");

export const read = (file: string) => readFileSync(join(styles, file), "utf8");

export type Vars = Record<string, string>;
export type Mode = "light" | "dark";
export type Rgb = [number, number, number];
type Rgba = [...Rgb, number];

/** The declarations of the first rule whose selector starts a line, e.g. `.dark`. */
export function ruleBody(css: string, selector: string): string {
  const start = css.search(new RegExp(`^\\s*${selector.replace(/[.:()]/g, "\\$&")} \\{`, "m"));
  if (start < 0) throw new Error(`no rule for ${selector}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error(`unclosed rule for ${selector}`);
}

/** `--name: value;` declarations, with whitespace collapsed and comments dropped. */
export function declarations(body: string): Vars {
  const clean = body.replace(/\/\*[\s\S]*?\*\//g, "");
  return Object.fromEntries(
    [...clean.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [
      m[1]!,
      m[2]!.replace(/\s+/g, " ").trim(),
    ]),
  );
}

/** Every custom property in effect for a mode: scales, then roles, then the mode's overrides. */
export function modeVars(mode: Mode): Vars {
  const scales = read("scales.css");
  const theme = declarations(ruleBody(read("theme.css"), "@theme static"));
  const light = { ...declarations(ruleBody(scales, ":root")), ...theme };
  if (mode === "light") return light;
  return {
    ...light,
    ...declarations(ruleBody(scales, ".dark")),
    ...declarations(ruleBody(read("roles-dark.css"), ".dark")),
  };
}

export function resolve(value: string, vars: Vars): string {
  let out = value;
  for (let i = 0; i < 10 && out.includes("var("); i++) {
    out = out.replace(/var\((--[\w-]+)\)/g, (_, name: string) => {
      const next = vars[name];
      if (next === undefined) throw new Error(`undefined ${name}`);
      return next;
    });
  }
  return out;
}

const toGamma = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

export function parse(value: string): Rgba {
  if (value === "#fff") return [1, 1, 1, 1];
  if (value === "#000") return [0, 0, 0, 1];
  const match = /^oklch\(([\d.]+)(%?) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/.exec(value);
  if (!match) throw new Error(`unparsed color ${value}`);
  const L = Number(match[1]) / (match[2] ? 100 : 1);
  const C = Number(match[3]);
  const H = (Number(match[4]) * Math.PI) / 180;
  const a = C * Math.cos(H);
  const b = C * Math.sin(H);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const [r, g, bl] = linear.map((c) => Math.min(1, Math.max(0, toGamma(c))));
  return [r!, g!, bl!, match[5] === undefined ? 1 : Number(match[5])];
}

/** Composites in gamma-encoded sRGB, as browsers do. */
const over = ([r, g, b, a]: Rgba, bg: Rgb): Rgb => [
  r * a + bg[0] * (1 - a),
  g * a + bg[1] * (1 - a),
  b * a + bg[2] * (1 - a),
];

const luminance = ([r, g, b]: Rgb) =>
  0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

export function contrast(fg: Rgb, bg: Rgb): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** A role's color, composited over `page` when it is translucent. */
export function role(name: string, vars: Vars, backdrop: Rgb): Rgb {
  return over(parse(resolve(vars[`--color-${name}`] ?? "", vars)), backdrop);
}
