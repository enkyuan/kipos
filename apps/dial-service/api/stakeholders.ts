import { denyUnlessAuthorized, engagementOf, failure, json } from "../src/http.js";
import { directory, publicView } from "../src/stakeholders.js";

// GET /stakeholders?engagement_id=: people Superpower may contact. Phone
// numbers never leave the server.
export function GET(request: Request): Response {
  const denied = denyUnlessAuthorized(request);
  if (denied) return denied;
  const engagementId = engagementOf(request);
  if (!engagementId) return failure(400, "engagement_id is required");
  return json({ stakeholders: directory(engagementId).map(publicView) });
}
