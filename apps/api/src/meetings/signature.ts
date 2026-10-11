import { createHmac, timingSafeEqual } from "node:crypto";

// Replay window: a captured delivery stops verifying after five minutes.
const TOLERANCE_SECONDS = 5 * 60;

type SignedRequest = {
  /** The shared secret set with Vexa's `PUT /user/webhook`. */
  secret: string;
  headers: Headers;
  /** The raw body, exactly as received. */
  body: string;
  nowSeconds: number;
};

/**
 * Verifies a Vexa webhook (docs.vexa.ai/webhooks): `X-Webhook-Signature` is
 * `sha256=<hex HMAC-SHA256(secret, "<X-Webhook-Timestamp>." + body)>`.
 */
export function verifyVexaSignature({ secret, headers, body, nowSeconds }: SignedRequest): boolean {
  const timestamp = headers.get("x-webhook-timestamp");
  const signature = headers.get("x-webhook-signature");
  if (!secret || !timestamp || !signature || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(nowSeconds - Number(timestamp)) > TOLERANCE_SECONDS) return false;
  const expected = Buffer.from(
    `sha256=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`,
  );
  const candidate = Buffer.from(signature);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}
