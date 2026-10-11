import { describe, expect, test } from "bun:test";
import { belongsTo, callClarification, callInstruction } from "./clarification";
import type { DialCall } from "./dial";

const stakeholder = {
  id: "finance-manager",
  name: "Akshat Gopalan",
  role: "Finance Manager",
  phone: "+15555550100",
};
const ask = {
  question: "Who approves nonstandard entitlements?",
  stakeholder,
  company: "Acme",
  requester: "Sam",
};

function call(overrides: Partial<DialCall> = {}): DialCall {
  return {
    id: "call_1",
    to: stakeholder.phone,
    instruction: callInstruction("acme", ask),
    createdAt: "2026-10-11T22:00:00Z",
    ...overrides,
  };
}

describe("call clarifications", () => {
  test("carry their engagement and question in the call record itself", () => {
    const c = callClarification(call());
    expect(c.engagement_id).toBe("acme");
    expect(c.question).toBe(ask.question);
    expect(c.stakeholder).toEqual({
      id: "finance-manager",
      name: "Akshat Gopalan",
      role: "Finance Manager",
    });
  });

  test("never expose the stakeholder's phone number", () => {
    expect(JSON.stringify(callClarification(call()))).not.toContain(stakeholder.phone);
  });

  test("belong only to the engagement that asked", () => {
    expect(belongsTo(call(), "acme")).toBe(true);
    expect(belongsTo(call(), "globex")).toBe(false);
    expect(belongsTo(call({ instruction: "someone else's call" }), "acme")).toBe(false);
  });

  test("report a finished call as completed, not answered, so the transcript gets read", () => {
    const done = call({
      status: { state: "Terminated", terminationType: "completed" },
      transcript: "User: I don't know.",
    });
    expect(callClarification(done).status).toBe("completed");
  });

  test("wait for the transcript before reporting a call finished", () => {
    const done = call({
      status: { state: "Terminated", terminationType: "completed" },
      transcript: null,
    });
    expect(callClarification(done).status).toBe("transcribing");
  });

  test("map unanswered and failed calls to explicit statuses", () => {
    const ended = (terminationType: string) =>
      callClarification(call({ status: { state: "Terminated", terminationType } })).status;
    expect(ended("no-answer")).toBe("no_answer");
    expect(ended("busy")).toBe("no_answer");
    expect(ended("canceled")).toBe("canceled");
    expect(ended("failed")).toBe("failed");
    expect(callClarification(call({ status: { state: "Ringing" } })).status).toBe("calling");
    expect(callClarification(call({ status: { state: "In-Progress" } })).status).toBe(
      "in_progress",
    );
  });
});
