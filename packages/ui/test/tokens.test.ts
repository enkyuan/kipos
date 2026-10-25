import { describe, expect, test } from "bun:test";
import { renderScales } from "../scripts/palette";
import {
  declarations,
  type Mode,
  modeVars,
  parse,
  read,
  readComponents,
  resolve,
  ruleBody,
  type Vars,
} from "./css";

// The three tiers (scales -> roles -> component variables) are a contract:
// these tests keep every role defined and legible in each mode, and keep
// components reading roles only.

const modes: Mode[] = ["light", "dark"];
const theme = declarations(ruleBody(read("theme.css"), "@theme static"));
const roleNames = Object.keys(theme).filter((name) => name.startsWith("--color-"));
const darkRoles = declarations(ruleBody(read("roles-dark.css"), ".dark"));
const components = readComponents();

describe("scales", () => {
  test("scales.css is what scripts/palette.ts generates", () => {
    expect(read("scales.css")).toBe(renderScales());
  });
});

describe("roles", () => {
  test.each(modes)("every color role resolves to a color in %s", (mode) => {
    const vars = modeVars(mode);
    for (const name of roleNames) {
      expect({ name, color: parse(resolve(vars[name]!, vars)).length }).toEqual({ name, color: 4 });
    }
  });

  // CSS cannot share one block between a class and a media query, so the
  // system-preference copy is kept in step by this test.
  test("the system-preference dark roles are the .dark roles", () => {
    const system = declarations(ruleBody(read("roles-dark.css"), ":root:not(.light)"));
    expect(system).toEqual(darkRoles);
  });

  test("dark re-declares only tokens that exist, and only to a different value", () => {
    const redundant: string[] = [];
    for (const [name, value] of Object.entries(darkRoles)) {
      expect({ name, defined: name in theme }).toEqual({ name, defined: true });
      if (theme[name] === value) redundant.push(name);
    }
    expect(redundant).toEqual([]);
  });

  test("high-contrast overrides only point at defined roles and scale steps", () => {
    const vars = modeVars("light");
    const overrides = declarations(ruleBody(read("roles-dark.css"), ":root:root"));
    for (const [name, value] of Object.entries(overrides)) {
      expect({ name, defined: name in theme }).toEqual({ name, defined: true });
      expect(() => resolve(value, vars)).not.toThrow();
    }
  });
});

describe("components", () => {
  test("component classes read roles, never scale steps or literal colors", () => {
    const scaleStep = /var\(--(gray|brand|positive|warning|danger|info|black|white)-a?\d+/;
    const literal = /#[0-9a-f]{3,8}\b|oklch\(|rgba?\(/i;
    expect({ scaleStep: scaleStep.test(components), literal: literal.test(components) }).toEqual({
      scaleStep: false,
      literal: false,
    });
  });

  // Base UI sets these on the tab list at runtime.
  const providedByBaseUi = ["--active-tab-left", "--active-tab-width"];

  test("every variable a component reads is defined", () => {
    const defined: Vars = {
      ...modeVars("dark"),
      ...declarations(components.replace(/[{}]/g, ";")),
    };
    const missing = [...components.matchAll(/var\((--[\w-]+)\)/g)]
      .map((match) => match[1]!)
      .filter((name) => !(name in defined) && !providedByBaseUi.includes(name));
    expect(missing).toEqual([]);
  });
});
