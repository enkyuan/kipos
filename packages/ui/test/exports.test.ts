import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import manifest from "../package.json";

const root = join(import.meta.dir, "..");
const exportedFiles = Object.values(manifest.exports).map((entry) =>
  typeof entry === "string" ? entry : entry.default,
);

describe("public exports", () => {
  test("every export points at a file that exists", async () => {
    for (const file of exportedFiles) {
      expect(await Bun.file(join(root, file)).exists()).toBe(true);
    }
  });

  // A primitive nobody can import is dead code; one imported by path
  // instead of its export bypasses the public contract.
  test("every primitive is exported under its own name", () => {
    const primitives = readdirSync(join(root, "src/primitives")).filter((name) =>
      name.endsWith(".tsx"),
    );
    for (const name of primitives) {
      const subpath = `./${name.replace(/\.tsx$/, "")}` as keyof typeof manifest.exports;
      expect(manifest.exports[subpath]).toBeDefined();
    }
  });
});
