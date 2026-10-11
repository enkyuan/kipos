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

describe("FDE workspace (production build)", () => {
  test("server-renders the start form with the recording notice and consent control", async () => {
    const response = await render("/");
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Shadow a meeting");
    expect(html).toContain("Google Meet link");
    expect(html).toContain("Recording notice");
    expect(html).toContain('role="checkbox"');
    expect(html).toContain("Start shadowing");
  });

  test("renders a meeting page shell that loads its session in the browser", async () => {
    const response = await render("/meetings/some-session-id");
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Loading the meeting");
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
