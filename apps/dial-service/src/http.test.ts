import { afterEach, describe, expect, test } from "bun:test";
import { denyUnlessAuthorized, engagementOf } from "./http";

afterEach(() => {
  delete process.env.SUPERPOWER_TOKEN;
});

const withToken = (token?: string) =>
  new Request(
    "https://x/knowledge",
    token ? { headers: { authorization: `Bearer ${token}` } } : {},
  );

describe("authorization", () => {
  test("refuses every request when no token is configured", () => {
    expect(denyUnlessAuthorized(withToken("anything"))?.status).toBe(500);
  });

  test("admits only the configured bearer token", () => {
    process.env.SUPERPOWER_TOKEN = "s3cret";
    expect(denyUnlessAuthorized(withToken("s3cret"))).toBeNull();
    expect(denyUnlessAuthorized(withToken("wrong"))?.status).toBe(401);
    expect(denyUnlessAuthorized(withToken())?.status).toBe(401);
  });
});

describe("engagement scope", () => {
  test("reads the engagement from the body, header, or query", () => {
    expect(engagementOf(new Request("https://x/k?engagement_id=acme"))).toBe("acme");
    expect(
      engagementOf(new Request("https://x/k", { headers: { "x-engagement-id": "acme" } })),
    ).toBe("acme");
    expect(engagementOf(new Request("https://x/k"), { engagement_id: "acme" })).toBe("acme");
    expect(engagementOf(new Request("https://x/k"))).toBe("");
  });
});
