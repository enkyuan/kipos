/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

// Runs against the production build (`bun run test` builds first): the same
// server entry a deployment serves, not the dev server.
// A computed specifier keeps typechecking independent of whether dist/ exists.
const entry = new URL("../../dist/server/server.js", import.meta.url).href;
const server = (await import(entry)).default as {
  fetch(request: Request): Promise<Response>;
};

describe("landing page (production build)", () => {
  test("server-renders the hero and the waitlist form", async () => {
    const response = await server.fetch(new Request("http://localhost/"));
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Build in tight loops.");
    expect(html).toContain('type="email"');
    expect(html).toContain("Join the waitlist");
  });

  test("links the compiled stylesheet, not the dev-only StyleX module", async () => {
    const html = await (await server.fetch(new Request("http://localhost/"))).text();
    expect(html).toMatch(/<link[^>]+href="\/assets\/app-[^"]+\.css"/);
    expect(html).not.toContain("virtual:stylex.css");
  });

  test("answers an unknown path with 404", async () => {
    const response = await server.fetch(new Request("http://localhost/no-such-page"));
    expect(response.status).toBe(404);
  });
});
