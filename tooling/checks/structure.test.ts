import { describe, expect, test } from "bun:test";
import { Glob } from "bun";
import { join } from "node:path";

// Repository-owned structural checks (AGENTS.md "CI contract"). Each one
// guards a convention that review would otherwise have to remember.

const root = join(import.meta.dir, "../..");
const ignored = /(^|\/)(node_modules|dist|\.output|\.tanstack)\//;

function files(pattern: string): string[] {
  return [...new Glob(pattern).scanSync({ cwd: root, dot: false })].filter(
    (path) => !ignored.test(path),
  );
}

const read = (path: string) => Bun.file(join(root, path)).text();

describe("naming", () => {
  // A vague container collects unrelated code; name the concept instead.
  test("no source file is a vague container", () => {
    const vague = /(^|\/)(utils?|helpers?|common|misc|shared|manager|stuff)\.(ts|tsx)$/;
    expect(
      files("{apps,packages,tooling}/**/*.{ts,tsx}").filter((path) => vague.test(path)),
    ).toEqual([]);
  });
});

describe("dependency direction", () => {
  // apps/web compiles against the API's types (Eden) but must never bundle
  // its runtime: that would ship server code, and bun:sqlite, to browsers.
  // One file owns that boundary, and it imports types only. It has no subject
  // until the first API call creates that file; the check then guards it.
  test("only apps/web/src/api/client.ts reaches @nomi/api, and for types only", async () => {
    const client = "apps/web/src/api/client.ts";
    const mentions = /["']@nomi\/api["']/;
    const valueImport =
      /import\s+(?!type\b)[^;]*?from\s*["']@nomi\/api["']|import\(\s*["']@nomi\/api["']|require\(\s*["']@nomi\/api["']/s;
    const offenders: string[] = [];
    for (const path of files("apps/web/**/*.{ts,tsx}")) {
      const source = await read(path);
      if (!mentions.test(source)) continue;
      if (path !== client) offenders.push(`${path}: imports @nomi/api outside ${client}`);
      else if (valueImport.test(source)) offenders.push(`${path}: value import of @nomi/api`);
    }
    expect(offenders).toEqual([]);
  });
});

describe("design system", () => {
  const source = "{apps,packages}/**/*.{ts,tsx,css,json}";

  // The system is Tailwind v4 and CSS variables (ADR 0008); a second styling
  // engine would split every component in two.
  test("no styling engine other than Tailwind remains", async () => {
    const offenders: string[] = [];
    const retired = new RegExp(["style", "x"].join(""), "i");
    for (const path of files(source)) {
      if (retired.test(await read(path))) offenders.push(path);
    }
    for (const path of ["package.json", "knip.jsonc", "tooling/oxlint.json"]) {
      if (retired.test(await read(path))) offenders.push(path);
    }
    expect(offenders).toEqual([]);
  });

  // Roles are the only colors app and primitive code may name; the scales
  // under them are replaceable (docs/decisions/0008-tailwind-design-system.md).
  test("app and primitive code names color roles only", async () => {
    const forbidden: [string, RegExp][] = [
      ["scale step", /--(gray|brand|positive|warning|danger|info|black|white)-a?\d/],
      ["literal color", /#[0-9a-f]{3,8}\b|\b(oklch|rgba?|hsla?)\(/i],
      [
        "arbitrary color",
        /\b(bg|text|border|fill|stroke|ring|outline|shadow)-\[(#|oklch|rgb|hsl|var\(--(gray|brand))/,
      ],
      ["dark: variant", /\bdark:/],
    ];
    const offenders: string[] = [];
    for (const path of files("{apps/web/src,packages/ui/src/primitives}/**/*.tsx")) {
      const code = await read(path);
      for (const [name, pattern] of forbidden) {
        if (pattern.test(code)) offenders.push(`${path}: ${name}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("workspaces", () => {
  const manifests = files("{apps,packages}/*/package.json");

  // The root scripts fan out with --filter; a workspace without these
  // scripts silently drops out of the gate.
  test("every app and code package can be typechecked and tested", async () => {
    for (const path of manifests.filter((p) => !p.startsWith("packages/tsconfig/"))) {
      const { scripts = {} } = await Bun.file(join(root, path)).json();
      expect({ path, typecheck: "typecheck" in scripts, test: "test" in scripts }).toEqual({
        path,
        typecheck: true,
        test: true,
      });
    }
  });

  // Exact versions make an install reproducible without trusting the lockfile alone.
  test("dependencies are pinned to exact versions", async () => {
    const loose: string[] = [];
    for (const path of [...manifests, "package.json"]) {
      const manifest = await Bun.file(join(root, path)).json();
      for (const field of ["dependencies", "devDependencies"]) {
        for (const [name, version] of Object.entries<string>(manifest[field] ?? {})) {
          if (!/^(\d+\.\d+\.\d+(-[\w.]+)?|workspace:\*)$/.test(version)) {
            loose.push(`${path} ${field}.${name}@${version}`);
          }
        }
      }
    }
    expect(loose).toEqual([]);
  });
});

describe("task records", () => {
  const states = ["SCOPED", "IMPLEMENTING", "REVIEW", "VERIFY", "DONE", "BLOCKED"];

  test("every task record states a valid lifecycle state", async () => {
    for (const path of files("docs/work/{active,completed,handoffs}/*.md")) {
      const state = (await read(path)).match(/^State: (\w+)/m)?.[1];
      expect({ path, state: states.includes(state ?? "") }).toEqual({ path, state: true });
    }
  });

  test("completed task records are DONE", async () => {
    for (const path of files("docs/work/completed/*.md")) {
      expect({ path, state: (await read(path)).match(/^State: (\w+)/m)?.[1] }).toEqual({
        path,
        state: "DONE",
      });
    }
  });
});
