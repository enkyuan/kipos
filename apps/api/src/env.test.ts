import { describe, expect, test } from "bun:test";
import { readEnv } from "./env";

describe("readEnv", () => {
  test("uses development defaults when nothing is set", () => {
    expect(readEnv({})).toEqual({ port: 3001, databasePath: "./data/ouro.sqlite" });
  });

  test("rejects a port that is present but invalid instead of falling back", () => {
    for (const PORT of ["70000", "", "0", "0x10", "1e3", " 80"]) {
      expect(() => readEnv({ PORT })).toThrow(/PORT/);
    }
  });

  test("rejects an empty database path", () => {
    expect(() => readEnv({ DATABASE_PATH: " " })).toThrow(/DATABASE_PATH/);
  });
});
