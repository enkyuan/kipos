import { expect, test } from "bun:test";
import { createApp } from "./app";

// Value: protects=createApp serves /health and answers an unknown route with the typed 404; fails_when=healthRoutes or errorBoundary is dropped from createApp; why_new=health and errors tests mount each plugin alone, never the composition; seam=none; no_claim=none beyond protects
test("createApp serves /health and answers an unknown route with the typed 404", async () => {
  const app = createApp();

  const health = await app.handle(new Request("http://test/health"));
  expect(health.status).toBe(200);
  expect(await health.json()).toEqual({ status: "ok" });

  const missing = await app.handle(new Request("http://test/nope"));
  expect(missing.status).toBe(404);
  expect(await missing.json()).toEqual({
    error: { code: "not_found", message: "No route matches this request." },
  });
});
