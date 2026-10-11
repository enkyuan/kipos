import type { Clarification, CallRequest } from "./clarification.js";
import { listMessages, sendMessage, type DialMessage } from "./dial.js";
import type { Stakeholder } from "./stakeholders.js";

// Text-message clarifications, still without a database: each outbound text
// carries a short reference ("Ref SP-7A3F1"), the clarification id is
// "sms-7A3F1", and the answer is whatever the stakeholder texts back after it.
const REF_PREFIX = "Ref SP-";
const REF_CODE = /Ref SP-([0-9A-F]{5})/;

export const isSmsId = (id: string) => /^sms-[0-9A-F]{5}$/.test(id);

// Plain SMS alphabet only: one curly quote or em dash cuts the carrier length
// limit from 1530 to 670 characters.
export function plainSms(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\n]/g, "");
}

export function smsBody(code: string, ask: CallRequest): string {
  const first = ask.stakeholder.name.split(" ")[0];
  const why = ask.context && ask.context.length < 240 ? `\n\nWhy we ask: ${ask.context}` : "";
  return plainSms(
    `Hi ${first}, this is Superpower, an AI assistant working with ${ask.requester} on the ${ask.company} project. ` +
      `Quick question: ${ask.question}${why}\n\nPlease reply to this text with your answer. ${REF_PREFIX}${code}`,
  );
}

export async function sendSmsClarification(ask: CallRequest): Promise<string> {
  const code = crypto.getRandomValues(new Uint8Array(3)).reduce((s, b) => s + b.toString(16), "");
  const ref = code.toUpperCase().padEnd(5, "0").slice(0, 5);
  await sendMessage(ask.stakeholder.phone, smsBody(ref, ask));
  return `sms-${ref}`;
}

// Replies are inbound texts from that person after our question, up to the
// next Superpower question we sent them.
export function repliesTo(sent: DialMessage, thread: DialMessage[]): DialMessage[] {
  const later = thread
    .filter((m) => Date.parse(m.createdAt) > Date.parse(sent.createdAt))
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const stop = later.findIndex((m) => m.direction === "outbound" && m.body.includes(REF_PREFIX));
  return (stop < 0 ? later : later.slice(0, stop)).filter((m) => m.direction === "inbound");
}

export function smsClarification(
  sent: DialMessage,
  who: Stakeholder,
  replies: DialMessage[],
): Clarification {
  const failed = sent.status === "failed" || sent.status === "undelivered";
  const status = failed ? "failed" : replies.length ? "replied" : "waiting_reply";
  const question = sent.body.match(/Quick question: ([\s\S]*?)\n\n(Why we ask|Please reply)/)?.[1];
  const transcript = replies.length
    ? [`Superpower: ${sent.body}`, ...replies.map((r) => `${who.name}: ${r.body}`)].join("\n")
    : null;
  return {
    id: `sms-${sent.body.match(REF_CODE)?.[1]}`,
    channel: "sms",
    question: question ?? null,
    stakeholder: { id: who.id, name: who.name, role: who.role },
    status,
    delivery: sent.status,
    delivery_error: sent.statusError ?? null,
    answer: null,
    transcript,
    replies: replies.map((r) => ({ text: r.body, at: r.createdAt })),
    created_at: sent.createdAt,
    next_step: {
      replied:
        "Read the reply. If it clearly answers the question, implement exactly that and cite this clarification id in a code comment. If not, do not guess: ask a follow-up. More replies may still arrive.",
      failed: `The text was not delivered (${sent.statusError ?? sent.status}). Tell the engineer; try a phone call instead.`,
      waiting_reply:
        "Text sent; waiting for a reply. Keep working on parts that do not depend on this answer and check back later.",
    }[status],
  };
}

// Rebuild an SMS clarification from Dial's message history. A text to anyone
// outside this engagement's directory reads as not found.
export async function loadSmsClarification(
  id: string,
  people: Stakeholder[],
): Promise<Clarification | null> {
  const ref = `${REF_PREFIX}${id.slice(4)}`;
  const sent = (await listMessages({ search: ref, direction: "outbound" })).find((m) =>
    m.body.includes(ref),
  );
  const who = people.find((p) => p.phone === sent?.to);
  if (!sent || !who) return null;
  const thread = await listMessages({ contact: who.phone, since: sent.createdAt });
  return smsClarification(sent, who, repliesTo(sent, thread));
}

export async function listSmsClarifications(people: Stakeholder[]): Promise<Clarification[]> {
  const phones = new Set(people.map((p) => p.phone));
  const sent = await listMessages({ search: REF_PREFIX, direction: "outbound" });
  const ids = new Set(
    sent.filter((m) => phones.has(m.to ?? "")).map((m) => `sms-${m.body.match(REF_CODE)?.[1]}`),
  );
  const loaded = await Promise.all(
    [...ids].filter(isSmsId).map((id) => loadSmsClarification(id, people)),
  );
  return loaded.filter((c): c is Clarification => c !== null);
}

// For the webhook: the latest Superpower text this person is replying to.
export async function smsClarificationForReply(from: string, people: Stakeholder[]) {
  const sent = await listMessages({ contact: from, direction: "outbound", search: REF_PREFIX });
  const code = sent.find((m) => REF_CODE.test(m.body))?.body.match(REF_CODE)?.[1];
  return code ? loadSmsClarification(`sms-${code}`, people) : null;
}
