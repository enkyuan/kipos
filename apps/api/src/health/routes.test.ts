import { expect, test } from "bun:test";
import { healthRoutes } from "./routes";

test("reports the process as up", async () => {
  const response = await healthRoutes.handle(new Request("http://test/health"));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});
