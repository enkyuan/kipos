import { askStakeholder, AskRejected, listClarifications, type AskBody } from "../../src/ask.js";
import { DialError } from "../../src/dial.js";
import { denyUnlessAuthorized, engagementOf, failure, json } from "../../src/http.js";

// POST /clarifications: ask one stakeholder one question by call or text.
export async function POST(request: Request): Promise<Response> {
  const denied = denyUnlessAuthorized(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as AskBody | null;
  if (!body) return failure(400, "Body must be JSON");
  const engagementId = engagementOf(request, body);
  if (!engagementId) return failure(400, "engagement_id is required");
  try {
    return json(await askStakeholder(engagementId, body), 201);
  } catch (cause) {
    if (cause instanceof AskRejected) return failure(cause.status, cause.message, cause.extra);
    // A Dial 401 means our key is wrong, not the caller's token.
    if (cause instanceof DialError)
      return failure(cause.status === 401 ? 502 : cause.status, cause.message);
    return failure(500, String(cause));
  }
}

// GET /clarifications?engagement_id=: recent calls and texts, newest first.
export async function GET(request: Request): Promise<Response> {
  const denied = denyUnlessAuthorized(request);
  if (denied) return denied;
  const engagementId = engagementOf(request);
  if (!engagementId) return failure(400, "engagement_id is required");
  try {
    return json({ clarifications: await listClarifications(engagementId) });
  } catch (cause) {
    return failure(cause instanceof DialError ? 502 : 500, String(cause));
  }
}
