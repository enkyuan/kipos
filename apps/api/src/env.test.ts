import { describe, expect, test } from "bun:test";
import { readEnv } from "./env";

const vexa = { VEXA_API_KEY: "key" };

describe("readEnv", () => {
  test("uses development defaults, the hosted Vexa API, and no analysis without a model key", () => {
    expect(readEnv(vexa)).toEqual({
      port: 3001,
      databasePath: "./data/ouro.sqlite",
      vexa: { apiKey: "key", apiUrl: "https://api.cloud.vexa.ai", webhookSecret: "" },
      analysis: null,
    });
  });

  test("enables analysis with a model key, on the default model unless one is named", () => {
    expect(readEnv({ ...vexa, ANTHROPIC_API_KEY: "sk" }).analysis).toEqual({
      apiKey: "sk",
      model: "claude-sonnet-5-5",
    });
    expect(readEnv({ ...vexa, ANTHROPIC_API_KEY: "sk", ANALYSIS_MODEL: "m" }).analysis?.model).toBe(
      "m",
    );
  });

  test("refuses to start without a Vexa key", () => {
    expect(() => readEnv({})).toThrow(/VEXA_API_KEY/);
  });

  test("accepts a self-hosted gateway and rejects a URL that is not http(s)", () => {
    expect(readEnv({ ...vexa, VEXA_API_URL: "http://localhost:18056/" }).vexa.apiUrl).toBe(
      "http://localhost:18056",
    );
    expect(() => readEnv({ ...vexa, VEXA_API_URL: "ftp://x" })).toThrow(/VEXA_API_URL/);
    expect(() => readEnv({ ...vexa, VEXA_API_URL: "nope" })).toThrow(/VEXA_API_URL/);
  });

  test("rejects a port that is present but invalid instead of falling back", () => {
    for (const PORT of ["70000", "", "0", "0x10", "1e3", " 80"]) {
      expect(() => readEnv({ ...vexa, PORT })).toThrow(/PORT/);
    }
  });

  test("rejects an empty database path", () => {
    expect(() => readEnv({ ...vexa, DATABASE_PATH: " " })).toThrow(/DATABASE_PATH/);
  });
});
