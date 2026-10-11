import { describe, expect, test } from "bun:test";
import type { DialMessage } from "./dial";
import { isSmsId, plainSms, repliesTo, smsBody, smsClarification } from "./sms";

const who = {
  id: "finance-manager",
  name: "Akshat Gopalan",
  role: "Finance Manager",
  phone: "+15555550100",
};
const ask = {
  question: "Who approves nonstandard entitlements?",
  stakeholder: who,
  company: "Acme",
  requester: "Sam",
};

function message(direction: DialMessage["direction"], body: string, at: string): DialMessage {
  const status = "delivered";
  return { id: at, to: who.phone, from: "+18505550000", body, direction, status, createdAt: at };
}

const question = message("outbound", smsBody("7A3F1", ask), "2026-10-11T22:00:00Z");

describe("text clarifications", () => {
  test("stay in the plain SMS alphabet so carriers allow the long limit", () => {
    expect(plainSms("Approver — “finance” … \u{1F600}")).toBe('Approver - "finance" ... ');
  });

  test("carry a reference that becomes the clarification id", () => {
    const c = smsClarification(question, who, []);
    expect(c.id).toBe("sms-7A3F1");
    expect(isSmsId(c.id)).toBe(true);
    expect(c.question).toBe(ask.question);
    expect(c.status).toBe("waiting_reply");
  });

  test("take the person's texts after the question, and stop at our next question", () => {
    const thread = [
      message("inbound", "an old text", "2026-10-11T21:00:00Z"),
      question,
      message("inbound", "Finance approves over $10k", "2026-10-11T22:01:00Z"),
      message("outbound", smsBody("AAAAA", ask), "2026-10-11T22:02:00Z"),
      message("inbound", "answer to the next question", "2026-10-11T22:03:00Z"),
    ];
    const c = smsClarification(question, who, repliesTo(question, thread));
    expect(c.status).toBe("replied");
    expect(c.replies).toEqual([{ text: "Finance approves over $10k", at: "2026-10-11T22:01:00Z" }]);
  });

  test("report a carrier rejection as failed with its reason", () => {
    const rejected = {
      ...question,
      status: "undelivered",
      statusError: "sender not registered for 10DLC",
    };
    const c = smsClarification(rejected, who, []);
    expect(c.status).toBe("failed");
    expect(c.next_step).toContain("sender not registered for 10DLC");
  });
});
