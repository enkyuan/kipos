/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

// Runs against the production build (`bun run test` builds first): the same
// server entry a deployment serves, not the dev server.
// A computed specifier keeps typechecking independent of whether dist/ exists.
const entry = new URL("../../dist/server/server.js", import.meta.url).href;
const server = (await import(entry)).default as {
  fetch(request: Request): Promise<Response>;
};
const clientDir = new URL("../../dist/client/", import.meta.url);

const render = async (path: string) => server.fetch(new Request(`http://localhost${path}`));

describe("web shell (production build)", () => {
  test("server-renders the home page with the wordmark and the design kit", async () => {
    const response = await render("/");
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toMatch(/<h1[^>]*>Ouro<\/h1>/);
    expect(html).toContain('data-slot="button"');
  });

  test("bundles the Glide faces the base stylesheet declares", async () => {
    const fonts = [...new Bun.Glob("**/glide-*.woff2").scanSync(clientDir.pathname)];
    expect(fonts.length).toBe(3);
  });

  // Zodiak's file stays out of git (the repository is public and its license
  // forbids redistribution), so only the retired EB Garamond face is checked.
  test("ships no EB Garamond face", async () => {
    expect([...new Bun.Glob("**/eb-garamond*").scanSync(clientDir.pathname)]).toEqual([]);
  });

  test("ships no development annotation tooling", async () => {
    for (const asset of new Bun.Glob("**/*.js").scanSync(clientDir.pathname)) {
      const source = await Bun.file(new URL(asset, clientDir)).text();
      expect({ asset, agentation: source.includes("agentation-") }).toEqual({
        asset,
        agentation: false,
      });
    }
  });

  test("links the compiled stylesheet, not the dev-only StyleX module", async () => {
    const html = await (await render("/")).text();
    expect(html).toMatch(/<link[^>]+href="\/assets\/app-[^"]+\.css"/);
    expect(html).not.toContain("virtual:stylex.css");
  });

  test("answers an unknown path with 404", async () => {
    expect((await render("/no-such-page")).status).toBe(404);
  });
});

// These read the compiled stylesheet: StyleX tokens only exist once the build
// has compiled them, so dist/ is where their contracts are visible.

type Block = { context: string[]; body: string };

// Splits minified CSS into innermost blocks, each with the at-rules and
// selectors that enclose it (outermost first, whitespace removed).
function cssBlocks(css: string): Block[] {
  const blocks: Block[] = [];
  const stack: string[] = [];
  let text = "";
  for (const char of css) {
    if (char === "{") {
      stack.push(text.replaceAll(/\s+/g, ""));
      text = "";
    } else if (char === "}") {
      if (text.trim()) blocks.push({ context: [...stack], body: text });
      stack.pop();
      text = "";
    } else {
      text += char;
    }
  }
  return blocks;
}

const stylesheet = async () => {
  let css = "";
  for (const asset of new Bun.Glob("**/*.css").scanSync(clientDir.pathname)) {
    css += await Bun.file(new URL(asset, clientDir)).text();
  }
  return cssBlocks(css);
};

const DARK = "@media(prefers-color-scheme:dark)";
const colorsIn = (blocks: Block[]) =>
  new Set(blocks.flatMap((block) => block.body.match(/oklch\([^)]*\)/g) ?? []));

describe("compiled stylesheet (production build)", () => {
  // A tap never leaves a control looking hovered. Fails when media.hover drops (pointer: fine) or a
  // style writes :hover outside media.hover.
  test("applies hover styles only where a fine pointer can hover", async () => {
    const hovers = (await stylesheet()).filter((block) => block.context.at(-1)?.includes(":hover"));
    expect(hovers.length).toBeGreaterThan(0);
    for (const { context } of hovers) {
      const guarded = context.includes("@media(hover:hover)and(pointer:fine)");
      expect({ rule: context.at(-1), guarded }).toEqual({ rule: context.at(-1), guarded: true });
    }
  });

  // Every font stack leads with a face the stylesheet declares. Fails when an @font-face family is
  // renamed or a token names an undeclared face, so text falls back.
  test("leads every font stack with a face it declares", async () => {
    const blocks = await stylesheet();
    const faces = blocks.filter((block) => block.context.at(-1) === "@font-face");
    const declared = new Set(faces.map((face) => face.body.match(/font-family:([^;]+)/)?.[1]));
    const stacks = blocks
      .filter((block) => block.context.at(-1) !== "@font-face")
      .flatMap((block) => block.body.split(";"))
      .map((declaration) => declaration.replace(/^\s*(font-family|--[\w-]+):/, "").trim())
      .filter((value) => /,\s*(serif|sans-serif|monospace)$/.test(value));
    expect(stacks.length).toBeGreaterThan(0);
    for (const stack of stacks) {
      const first = stack.split(",")[0]?.replaceAll(/["']/g, "").trim();
      expect({ stack, declared: declared.has(first) }).toEqual({ stack, declared: true });
    }
  });

  // base.css colors (page, text, border, outline) stay token values per theme. Fails when a retheme
  // updates tokens.stylex but not base.css.
  test("paints the base layer only with token colors of the same theme", async () => {
    const blocks = await stylesheet();
    const base = blocks.filter((block) => block.context[0] === "@layerbase");
    const tokens = blocks.filter((block) => block.context.at(-1)?.startsWith(":root"));
    for (const dark of [false, true]) {
      const inTheme = (block: Block) => block.context.includes(DARK) === dark;
      const used = colorsIn(base.filter(inTheme));
      const defined = colorsIn(tokens.filter(inTheme));
      expect(used.size).toBeGreaterThan(0);
      const stray = [...used].filter((value) => !defined.has(value));
      expect({ dark, stray }).toEqual({ dark, stray: [] });
    }
  });
});

// Resolves the rendered page against the compiled stylesheet: which rules an
// element's classes select, and what each custom property holds per theme.

type Rule = { selector: string; property: string; value: string };

const declarations = (body: string) =>
  body
    .split(";")
    .map((declaration) => declaration.match(/^\s*([\w-]+):(.*)$/))
    .flatMap((match) => (match?.[1] && match[2] ? [[match[1], match[2].trim()] as const] : []));

function rulesFor(blocks: Block[], classes: string[]): Rule[] {
  return blocks.flatMap(({ context, body }) => {
    const selector = context.at(-1) ?? "";
    const owner = selector.match(/^\.([\w-]+)/)?.[1];
    if (!owner || !classes.includes(owner)) return [];
    return declarations(body).map(([property, value]) => ({ selector, property, value }));
  });
}

const tokenBlocks = (blocks: Block[], dark: boolean) =>
  blocks.filter(
    (block) => block.context.at(-1)?.startsWith(":root") && block.context.includes(DARK) === dark,
  );

// Light values, overridden by dark ones in the dark theme.
const variables = (blocks: Block[], dark: boolean) =>
  new Map(
    [false, ...(dark ? [true] : [])].flatMap((inDark) =>
      tokenBlocks(blocks, inDark).flatMap((block) => declarations(block.body)),
    ),
  );

const resolve = (value: string, vars: Map<string, string>) =>
  value.replace(/^var\((--[\w-]+)\)$/, (_, name: string) => vars.get(name) ?? "unresolved");

const classLists = (html: string, tagPattern: string) =>
  [...html.matchAll(new RegExp(`<${tagPattern}\\b[^>]*class="([^"]*)"`, "g"))].map((match) =>
    (match[1] ?? "").split(/\s+/),
  );

const pixels = (length: string) => {
  const [, amount, unit] = length.match(/^([\d.]+)(rem|px)$/) ?? [];
  return Number(amount) * (unit === "rem" ? 16 : 1);
};

describe("rendered design kit (production build)", () => {
  // Buttons are pills: every button corner takes the scale's largest radius. Fails when Button
  // reads radius.xxl or another step instead of full.
  test("rounds every button with the largest radius on the scale", async () => {
    const blocks = await stylesheet();
    const lengths = (block: Block) => declarations(block.body).map(([, value]) => value);
    const scales = tokenBlocks(blocks, false).filter((block) =>
      lengths(block).every((value) => /^[\d.]+(rem|px)$/.test(value)),
    );
    expect(scales.length).toBe(1);
    const full = Math.max(...lengths(scales[0] as Block).map(pixels));
    const vars = variables(blocks, false);
    const buttons = classLists(await (await render("/")).text(), "button");
    expect(buttons.length).toBeGreaterThan(0);
    for (const classes of buttons) {
      const radii = rulesFor(blocks, classes)
        .filter((rule) => rule.property === "border-radius")
        .map((rule) => ({ selector: rule.selector, px: pixels(resolve(rule.value, vars)) }));
      expect(radii.length).toBeGreaterThan(0);
      expect(radii).toEqual(radii.map((radius) => ({ ...radius, px: full })));
    }
  });

  // The focus ring's offset is painted with the page color in both themes, so the ring separates
  // from any fill. Fails when the offset layer reads card, a fill or transparent.
  test("fills every button's focus ring offset with the page color, in both themes", async () => {
    const blocks = await stylesheet();
    const base = blocks.filter((block) => block.context[0] === "@layerbase");
    const buttons = classLists(await (await render("/")).text(), "button");
    expect(buttons.length).toBeGreaterThan(0);
    for (const dark of [false, true]) {
      const page = base
        .filter((block) => block.context.at(-1) === "html" && block.context.includes(DARK) === dark)
        .flatMap((block) => declarations(block.body))
        .find(([property]) => property === "background-color")?.[1];
      expect(page).toBeDefined();
      const vars = variables(blocks, dark);
      for (const classes of buttons) {
        const rings = rulesFor(blocks, classes).filter(
          (rule) => rule.selector.endsWith(":focus-visible") && rule.property === "box-shadow",
        );
        expect(rings.length).toBe(1);
        const [offset = "", ring = ""] = (rings[0] as Rule).value.split(/,(?![^(]*\))/);
        const spread = (layer: string) => pixels(layer.trim().split(/\s+/)[3] ?? "");
        const color = resolve(offset.trim().split(/\s+/)[4] ?? "", vars);
        expect({ dark, color, ringOutside: spread(ring) > spread(offset) }).toEqual({
          dark,
          color: page as string,
          ringOutside: true,
        });
      }
    }
  });

  // Heading-face text sets weight 400/500 and tightened tracking (unweighted headings take the
  // browser bold). Fails when a heading style drops fontWeight or tracking.
  test("gives every heading-face element an explicit 400 or 500 weight and tightened tracking", async () => {
    const blocks = await stylesheet();
    const serif = [...variables(blocks, false)].filter(([, value]) => /,\s*serif$/.test(value));
    expect(serif.length).toBe(1);
    const face = `var(${serif[0]?.[0]})`;
    const html = await (await render("/")).text();
    const headings = classLists(html, "[a-z][a-z0-9]*")
      .map((classes) => rulesFor(blocks, classes))
      .filter((rules) =>
        rules.some((rule) => rule.property === "font-family" && rule.value === face),
      );
    expect(headings.length).toBeGreaterThan(0);
    for (const rules of headings) {
      const of = (property: string) =>
        rules.filter((rule) => rule.property === property).map((rule) => rule.value);
      const weights = of("font-weight");
      expect({
        weighted: weights.length > 0 && weights.every((weight) => ["400", "500"].includes(weight)),
        tightened: of("letter-spacing").some((spacing) => spacing.startsWith("-")),
      }).toEqual({ weighted: true, tightened: true });
    }
  });
});
