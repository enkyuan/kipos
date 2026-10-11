import { extractAnswer } from "../../src/answer.js";
import { belongsTo, callClarification, type Clarification } from "../../src/clarification.js";
import { DialError, getCall, stopCall } from "../../src/dial.js";
import {
  denyUnlessAuthorized,
  engagementOf,
  failure,
  json,
  lastPathSegment,
} from "../../src/http.js";
import { isSmsId, loadSmsClarification } from "../../src/sms.js";
import { directory } from "../../src/stakeholders.js";

// Clarifications of another engagement look exactly like missing ones.
async function find(id: string, engagementId: string): Promise<Clarification | null> {
  if (isSmsId(id)) {
    const text = await loadSmsClarification(id, directory(engagementId));
    return text && { ...text, engagement_id: engagementId };
  }
  try {
    const call = await getCall(id);
    return belongsTo(call, engagementId) ? callClarification(call) : null;
  } catch (cause) {
    if (cause instanceof DialError && cause.status === 404) return null;
    throw cause;
  }
}

// GET /clarifications/:id: status, transcript or replies, and (with
// ANTHROPIC_API_KEY) a structured answer.
export async function GET(request: Request): Promise<Response> {
  const denied = denyUnlessAuthorized(request);
  if (denied) return denied;
  const engagementId = engagementOf(request);
  if (!engagementId) return failure(400, "engagement_id is required");
  try {
    const found = await find(lastPathSegment(request), engagementId);
    if (!found) return failure(404, "Clarification not found");
    return json({ ...found, answer: await extractAnswer(found.question, found.transcript) });
  } catch (cause) {
    return failure(cause instanceof DialError ? 502 : 500, String(cause));
  }
}

// DELETE /clarifications/:id: cancel a ringing call or hang up a live one.
export async function DELETE(request: Request): Promise<Response> {
  const denied = denyUnlessAuthorized(request);
  if (denied) return denied;
  const id = lastPathSegment(request);
  if (isSmsId(id)) return failure(400, "A text message cannot be stopped");
  const found = await find(id, engagementOf(request));
  if (!found) return failure(404, "Clarification not found");
  await stopCall(id);
  return json({ id, stopped: true });
}
