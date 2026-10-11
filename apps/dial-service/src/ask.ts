import {
  belongsTo,
  callClarification,
  callInstruction,
  type Clarification,
} from "./clarification.js";
import { listCalls, placeCall } from "./dial.js";
import { MOCK_KNOWLEDGE } from "./mock-knowledge.js";
import { listSmsClarifications, loadSmsClarification, sendSmsClarification } from "./sms.js";
import { bestMatch, directory, publicView, type Stakeholder } from "./stakeholders.js";

export type AskBody = {
  engagement_id?: string;
  question?: string;
  channel?: "call" | "sms";
  context?: string;
  topic?: string;
  stakeholder_id?: string;
  follow_ups?: string[];
  requested_by?: string;
  request_id?: string;
};

// An ask that cannot be placed, with the HTTP status that says why.
export class AskRejected extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly extra: object = {},
  ) {
    super(message);
  }
}

// The authorized person to ask: the one named, or the best expertise match.
function chooseStakeholder(engagementId: string, body: AskBody, question: string): Stakeholder {
  const people = directory(engagementId);
  if (!people.length) {
    throw new AskRejected(
      404,
      `No authorized stakeholders are configured for engagement '${engagementId}'`,
    );
  }
  const stakeholder = body.stakeholder_id
    ? people.find((p) => p.id === body.stakeholder_id)
    : bestMatch(people, `${body.topic ?? ""} ${question}`);
  if (!stakeholder) {
    throw new AskRejected(
      404,
      "No matching authorized stakeholder. Pick one with GET /stakeholders.",
      {
        stakeholders: people.map(publicView),
      },
    );
  }
  if (!stakeholder.phone)
    throw new AskRejected(422, `${stakeholder.name} has no phone number on file`);
  return stakeholder;
}

// Validate an ask, pick the stakeholder, and place the call or send the text.
export async function askStakeholder(engagementId: string, body: AskBody): Promise<Clarification> {
  const question = (body.question ?? "").trim();
  if (question.length < 10)
    throw new AskRejected(400, "question is required (one specific question)");
  const channel = body.channel ?? "call";
  if (channel !== "call" && channel !== "sms")
    throw new AskRejected(400, "channel must be 'call' or 'sms'");

  const stakeholder = chooseStakeholder(engagementId, body, question);
  const ask = {
    question,
    context: body.context,
    followUps: body.follow_ups,
    stakeholder,
    company: MOCK_KNOWLEDGE[engagementId]?.company.name ?? "the client",
    requester: body.requested_by ?? "the engineering team",
  };
  if (channel === "sms") {
    const sent = await loadSmsClarification(await sendSmsClarification(ask), [stakeholder]);
    if (!sent) throw new Error("The text was sent but cannot be found in Dial's history");
    return { ...sent, engagement_id: engagementId };
  }
  const call = await placeCall({
    to: stakeholder.phone,
    instruction: callInstruction(engagementId, ask),
    idempotencyKey: body.request_id,
  });
  return callClarification(call);
}

// Every clarification (calls and texts) for an engagement, newest first.
export async function listClarifications(engagementId: string): Promise<Clarification[]> {
  const [calls, texts] = await Promise.all([
    listCalls().then((all) =>
      all.filter((c) => belongsTo(c, engagementId)).map((c) => callClarification(c)),
    ),
    listSmsClarifications(directory(engagementId)),
  ]);
  return [...calls, ...texts.map((t) => ({ ...t, engagement_id: engagementId }))].sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
  );
}
