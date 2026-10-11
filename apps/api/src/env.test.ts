import { describe, expect, test } from "bun:test";
import { readEnv } from "./env";

const vexa = { VEXA_API_KEY: "key" };

describe("readEnv", () => {
  test("uses development defaults, the hosted Vexa API, and no analysis without a Bedrock key", () => {
    expect(readEnv(vexa)).toEqual({
      port: 3001,
      databasePath: "./data/ouro.sqlite",
      vexa: { apiKey: "key", apiUrl: "https://api.cloud.vexa.ai", webhookSecret: "" },
      analysis: null,
    });
  });

  test("enables analysis with a Bedrock key, on Sonnet 4.6 in us-east-1 unless told otherwise", () => {
    expect(readEnv({ ...vexa, AWS_BEARER_TOKEN_BEDROCK: "bk" }).analysis).toEqual({
      apiKey: "bk",
      region: "us-east-1",
      model: "us.anthropic.claude-sonnet-4-6",
    });
    const custom = { AWS_BEARER_TOKEN_BEDROCK: "bk", AWS_REGION: "us-west-2", ANALYSIS_MODEL: "m" };
    expect(readEnv({ ...vexa, ...custom }).analysis).toEqual({
      apiKey: "bk",
      region: "us-west-2",
      model: "m",
    });
  });

  test("ignores the Anthropic API key: analysis runs only on Bedrock", () => {
    expect(readEnv({ ...vexa, ANTHROPIC_API_KEY: "sk" }).analysis).toBeNull();
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
