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
  test("only apps/web/src/api/client.ts reaches @kipos/api, and for types only", async () => {
    const client = "apps/web/src/api/client.ts";
    const mentions = /["']@kipos\/api["']/;
    const valueImport =
      /import\s+(?!type\b)[^;]*?from\s*["']@kipos\/api["']|import\(\s*["']@kipos\/api["']|require\(\s*["']@kipos\/api["']/s;
    const offenders: string[] = [];
    for (const path of files("apps/web/**/*.{ts,tsx}")) {
      const source = await read(path);
      if (!mentions.test(source)) continue;
      if (path !== client) offenders.push(`${path}: imports @kipos/api outside ${client}`);
      else if (valueImport.test(source)) offenders.push(`${path}: value import of @kipos/api`);
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
