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

describe("home page (production build)", () => {
  // Value: protects=the home page ships the root title, language and wordmark link; fails_when=the root head or the layout drops them; why_new=the existing assertions covered status and h1 only; seam=none; no_claim=visual layout
  test("server-renders the home page with its heading", async () => {
    const response = await render("/");
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("<h1");
    expect(html).toContain("A Grok bot for students.");
    expect(html).toContain("<title>Kipos</title>");
    expect(html).toContain('<html lang="en"');
    expect(html).toMatch(/<a[^>]+href="\/"[^>]*>kipos<\/a>/);
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

  // Value: protects=an unknown path answers 404 with the not-found message and a way home; fails_when=the not-found component or its link is dropped; why_new=the previous assertion covered the status only; seam=none; no_claim=visual layout
  test("answers an unknown path with 404", async () => {
    const response = await render("/no-such-page");
    expect(response.status).toBe(404);
    const html = await response.text();
    expect(html).toContain("Page not found");
    expect(html).toMatch(/<a[^>]+href="\/"[^>]*>Back home<\/a>/);
  });
});
