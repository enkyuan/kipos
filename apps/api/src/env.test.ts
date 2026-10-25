import { describe, expect, test } from "bun:test";
import { readEnv } from "./env";

describe("readEnv", () => {
  test("uses the development default port", () => {
    expect(readEnv({})).toEqual({ port: 3001 });
  });

  test("reads a port", () => {
    expect(readEnv({ PORT: "4000" })).toEqual({ port: 4000 });
  });

  test("rejects a port that is present but invalid instead of falling back", () => {
    for (const PORT of ["70000", "", "0", "0x10", "1e3", " 80"]) {
      expect(() => readEnv({ PORT })).toThrow(/PORT/);
    }
  });
});
