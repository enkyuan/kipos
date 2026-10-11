import { beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { createApp } from "../app";
import { openDatabase } from "../database";
import type { ApiError } from "../errors";
import { createStores } from "../stores";

let db: Database;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  db = openDatabase(":memory:");
  app = createApp(createStores(db));
});

function join(body: unknown) {
  return app.handle(
    new Request("http://test/v1/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

const entries = () => db.query<{ email: string }, []>("SELECT email FROM waitlist_entries").all();

describe("POST /v1/waitlist", () => {
  test("records a new email", async () => {
    const response = await join({ email: "ada@example.com" });
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ status: "accepted" });
    expect(entries()).toEqual([{ email: "ada@example.com" }]);
  });

  test("treats a repeat join, in any letter case, as the same entry", async () => {
    await join({ email: "ada@example.com" });
    const repeat = await join({ email: "ADA@Example.com" });
    expect(repeat.status).toBe(202);
    expect(entries()).toHaveLength(1);
  });

  test("answers a repeat join exactly like a new one", async () => {
    const first = await join({ email: "ada@example.com" });
    const second = await join({ email: "ada@example.com" });
    expect(await second.json()).toEqual(await first.json());
  });

  test("rejects an invalid email without recording anything", async () => {
    const response = await join({ email: "not-an-email" });
    expect(response.status).toBe(422);
    const body = (await response.json()) as ApiError;
    expect(body.error.code).toBe("invalid_request");
    expect(entries()).toHaveLength(0);
  });
});
