import type { DialCall } from "./dial.js";
import type { Stakeholder } from "./stakeholders.js";

// A clarification asks one stakeholder one question, by phone call or text.
// "completed" (call) and "replied" (text) mean the conversation happened, not
// that the question was answered: the reader checks the transcript.
export type ClarificationStatus =
  | "calling"
  | "in_progress"
  | "transcribing"
  | "completed"
  | "waiting_reply"
  | "replied"
  | "no_answer"
  | "failed"
  | "canceled";

export type Clarification = {
  id: string;
  channel: "call" | "sms";
  engagement_id?: string;
  question: string | null;
  stakeholder: { id: string; name: string; role: string } | null;
  status: ClarificationStatus;
  transcript: string | null;
  answer: unknown;
  created_at: string;
  next_step: string;
  [detail: string]: unknown;
};

export const FINISHED: ReadonlySet<ClarificationStatus> = new Set(["completed", "replied"]);

export type CallRequest = {
  question: string;
  context?: string;
  followUps?: string[];
  stakeholder: Stakeholder;
  company: string;
  requester: string;
};

// The service keeps no database: the Dial call record is the source of truth,
// and our metadata rides at the end of the instruction, which Dial stores and
// returns on every call read.
const META_TAG = "SUPERPOWER_META=";

type CallMeta = {
  engagement_id: string;
  question: string;
  context: string | null;
  requested_by: string;
  stakeholder: { id: string; name: string; role: string };
};

export function callInstruction(engagementId: string, ask: CallRequest): string {
  const { question, context, followUps, stakeholder, company, requester } = ask;
  const first = stakeholder.name.split(" ")[0];
  const followUpLines = (followUps ?? []).map((f) => `   - ${f}`).join("\n");
  const meta: CallMeta = {
    engagement_id: engagementId,
    question,
    context: context ?? null,
    requested_by: requester,
    stakeholder: { id: stakeholder.id, name: stakeholder.name, role: stakeholder.role },
  };
  return `You are Superpower, an AI assistant calling on behalf of ${requester}, an engineer who is building software for ${company}. You are calling ${stakeholder.name} (${stakeholder.role}). Your only goal is to get a clear, specific answer to ONE business question so the software is built correctly.

How to run the call:
1. Greet ${first} by first name. In one sentence, say you are Superpower, an AI assistant working with ${requester} on the ${company} project, and that you have one quick question. Ask if they have two minutes. If not, ask when is a good time, thank them, and end the call.
2. Ask the question in plain words: "${question}"
${context ? `   Background you can share if they ask why: ${context}\n` : ""}3. If the answer is vague, ask at most two short follow-up questions to pin down exact numbers or thresholds, who approves, the exceptions, and whether the rule always applies.
${followUpLines ? `   Follow-ups worth asking if not already covered:\n${followUpLines}\n` : ""}4. Repeat the answer back in one sentence and ask them to confirm it is right.
5. Thank them and end the call.

Rules: keep the call under three minutes. Be friendly and brief. Never guess or suggest an answer yourself. If they do not know, ask who would know, then end politely. Do not discuss anything unrelated to the question.

INTERNAL REFERENCE, never read aloud or mention: ${META_TAG}${JSON.stringify(meta)}`;
}

export function callMeta(call: DialCall): CallMeta | null {
  const instruction = call.instruction ?? "";
  const at = instruction.lastIndexOf(META_TAG);
  if (at < 0) return null;
  try {
    return JSON.parse(instruction.slice(at + META_TAG.length)) as CallMeta;
  } catch {
    return null;
  }
}

export function belongsTo(call: DialCall, engagementId: string): boolean {
  return callMeta(call)?.engagement_id === engagementId;
}

function callStatus(call: DialCall): ClarificationStatus {
  const { state, terminationType } = call.status ?? {};
  if (state === "In-Progress") return "in_progress";
  if (state !== "Terminated") return "calling";
  if (terminationType === "completed") return call.transcript ? "completed" : "transcribing";
  if (terminationType === "busy" || terminationType === "no-answer") return "no_answer";
  return terminationType === "canceled" ? "canceled" : "failed";
}

const NEXT_STEP: Record<string, string> = {
  calling:
    "The call is live. Keep working on parts that do not depend on this answer and check back in about a minute.",
  in_progress:
    "The call is live. Keep working on parts that do not depend on this answer and check back in about a minute.",
  transcribing:
    "The call ended; the transcript is being processed. Check again in 10 to 20 seconds.",
  completed:
    "Read the transcript. If the stakeholder gave a clear answer, implement exactly that and cite this clarification id in a code comment. If they did not (didn't know, deflected, call cut short), do not guess: tell the engineer and ask a follow-up or someone else.",
  no_answer:
    "Nobody picked up. Tell the engineer, and either retry later or ask a different stakeholder.",
};
const FALLBACK_STEP = "The call did not complete. Tell the engineer; do not guess the rule.";

// A call placed outside Superpower has no metadata; it still maps, with nulls.
const NO_META = {
  engagement_id: undefined,
  question: null,
  context: null,
  requested_by: null,
  stakeholder: null,
};

export function callClarification(call: DialCall, answer: unknown = null): Clarification {
  const { engagement_id, question, context, requested_by, stakeholder } = callMeta(call) ?? NO_META;
  const status = callStatus(call);
  return {
    id: call.id,
    channel: "call",
    engagement_id,
    question,
    context,
    requested_by,
    stakeholder,
    status,
    call_state: call.status?.label ?? call.status?.state ?? null,
    duration_seconds: call.duration ?? null,
    answer,
    transcript: call.transcript ?? null,
    created_at: call.createdAt,
    next_step: NEXT_STEP[status] ?? FALLBACK_STEP,
  };
}
