import { describe, expect, test } from "bun:test";
import { createHmac } from "node:crypto";
import { verifySignature } from "./webhook";

const secret = "whsec_test";
const body = '{"type":"call.ended"}';
const now = Math.floor(Date.now() / 1000);
const sign = (t: number, b = body) =>
  `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${b}`).digest("hex")}`;

describe("Dial webhook signatures", () => {
  test("accept a fresh delivery signed with our secret", () => {
    expect(verifySignature(secret, sign(now), body)).toBe(true);
  });

  test("reject a tampered body, a wrong secret, or a malformed header", () => {
    expect(verifySignature(secret, sign(now), '{"type":"forged"}')).toBe(false);
    expect(verifySignature("whsec_other", sign(now), body)).toBe(false);
    expect(verifySignature(secret, "garbage", body)).toBe(false);
  });

  test("reject a replay older than five minutes", () => {
    expect(verifySignature(secret, sign(now - 301), body)).toBe(false);
  });
});
