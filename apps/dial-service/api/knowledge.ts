import { listClarifications } from "../src/ask.js";
import { FINISHED } from "../src/clarification.js";
import { denyUnlessAuthorized, engagementOf, failure, json } from "../src/http.js";
import { MOCK_KNOWLEDGE } from "../src/mock-knowledge.js";

// GET /knowledge?engagement_id=: placeholder company knowledge plus every
// finished clarification, so answers from calls and texts show up at once.
export async function GET(request: Request): Promise<Response> {
  const denied = denyUnlessAuthorized(request);
  if (denied) return denied;
  const engagementId = engagementOf(request);
  const base = MOCK_KNOWLEDGE[engagementId];
  if (!base) return failure(404, `Unknown engagement '${engagementId}'`);

  // Knowledge still serves when Dial is unreachable; it just lacks answers.
  const finished = await listClarifications(engagementId).catch(() => []);
  const clarifications = finished
    .filter((c) => FINISHED.has(c.status))
    .map(({ id, channel, question, stakeholder, transcript, created_at }) => ({
      id,
      channel,
      question,
      stakeholder,
      transcript,
      answered_at: created_at,
      evidence: [`dial-${channel}:${id}`],
    }));
  return json({ ...base, clarifications, source: "dial-service mock" });
}
