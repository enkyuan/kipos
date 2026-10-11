import { createHmac, timingSafeEqual } from "node:crypto";
import { extractAnswer, forwardToKnowledge } from "../../src/answer.js";
import { callClarification, callMeta, type Clarification } from "../../src/clarification.js";
import { getCall } from "../../src/dial.js";
import { failure, json } from "../../src/http.js";
import { smsClarificationForReply } from "../../src/sms.js";
import { directory, engagementForPhone } from "../../src/stakeholders.js";

type DialEvent = {
  type: string;
  data?: { callId?: string; from?: string; transcriptAvailable?: boolean };
};

// Dial signs each delivery: X-Dial-Signature: t=<unix>,v1=<hex HMAC of "t.body">.
// Deliveries older than five minutes are refused to limit replay.
export function verifySignature(secret: string, header: string, rawBody: string) {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  if (!parts.t || !parts.v1) return false;
  const expected = createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest();
  const given = Buffer.from(parts.v1, "hex");
  const fresh = Math.abs(Date.now() / 1000 - Number(parts.t)) < 300;
  return given.length === expected.length && timingSafeEqual(given, expected) && fresh;
}

async function repliedText(from: string): Promise<Clarification | null> {
  const engagementId = engagementForPhone(from);
  if (!engagementId) return null;
  const text = await smsClarificationForReply(from, directory(engagementId));
  return text && { ...text, engagement_id: engagementId };
}

async function finishedClarification(event: DialEvent): Promise<Clarification | null> {
  if (event.type === "message.received")
    return event.data?.from ? repliedText(event.data.from) : null;
  const callDone =
    event.type === "call.transcribed" ||
    (event.type === "call.ended" && event.data?.transcriptAvailable === false);
  if (!callDone || !event.data?.callId) return null;
  const call = await getCall(event.data.callId);
  return callMeta(call) ? callClarification(call) : null;
}

// POST /dial/webhook: when a clarification call is transcribed or a text gets
// a reply, push it to the knowledge backend. Dial retries non-2xx deliveries,
// and forwarding the same answer twice is harmless.
export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();
  const secret = process.env.DIAL_WEBHOOK_SECRET ?? "";
  if (!secret || !verifySignature(secret, request.headers.get("x-dial-signature") ?? "", raw)) {
    return failure(401, "Bad signature");
  }
  const event = JSON.parse(raw) as DialEvent;
  const finished = await finishedClarification(event);
  if (!finished) return json({ ok: true, ignored: event.type });
  const answer = await extractAnswer(finished.question, finished.transcript);
  return json({
    ok: true,
    clarification: finished.id,
    ...(await forwardToKnowledge({ ...finished, answer })),
  });
}
