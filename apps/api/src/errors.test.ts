import { describe, expect, test } from "bun:test";
import { Elysia, t } from "elysia";
import { apiError, apiErrorSchema, errorBoundary, type ApiError } from "./errors";

const app = new Elysia()
  .use(errorBoundary)
  .post("/echo", ({ body }) => body)
  .get("/boom", () => {
    throw new Error("connection string postgres://secret");
  })
  .get(
    "/conflict",
    ({ status }) => {
      throw status(409, apiError("conflict", "Already exists."));
    },
    { response: { 409: apiErrorSchema } },
  )
  // A handler whose output breaks its own declared schema: a server bug.
  .get("/drift", () => ({ count: "three" }) as unknown as { count: number }, {
    response: { 200: t.Object({ count: t.Number() }) },
  });

function silenced<T>(run: () => Promise<T>): Promise<T> {
  const original = console.error;
  console.error = () => {};
  return run().finally(() => {
    console.error = original;
  });
}

describe("errorBoundary", () => {
  test("answers an unknown route with a typed 404", async () => {
    const response = await app.handle(new Request("http://test/nope"));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: "not_found", message: "No route matches this request." },
    });
  });

  test("never echoes an unexpected error's message", async () => {
    const response = await silenced(() => app.handle(new Request("http://test/boom")));
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("secret");
  });

  test("answers an unparsable body as a typed 400", async () => {
    const response = await app.handle(
      new Request("http://test/echo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{not json",
      }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()) as ApiError).toEqual(
      apiError("malformed_request", "The request body could not be parsed."),
    );
  });

  test("keeps the status and body of a deliberately thrown failure", async () => {
    const response = await app.handle(new Request("http://test/conflict"));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(apiError("conflict", "Already exists."));
  });

  test("answers a response that breaks its own schema as a server error, not a bad request", async () => {
    const response = await silenced(() => app.handle(new Request("http://test/drift")));
    expect(response.status).toBe(500);
    expect(((await response.json()) as ApiError).error.code).toBe("internal");
  });
});
