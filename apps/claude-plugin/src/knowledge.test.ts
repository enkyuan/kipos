import { describe, expect, test } from "bun:test";
import {
  flatten,
  overview,
  rank,
  requirementsFor,
  sessionBriefing,
  type Knowledge,
} from "./knowledge";

const acme: Knowledge = {
  company: { name: "Acme", summary: "Sells monitoring subscriptions." },
  requirements: [
    {
      id: "req-audit",
      statement: "Every entitlement change needs an audit record.",
      status: "confirmed",
    },
  ],
  business_rules: [
    {
      id: "rule-legacy",
      rule: "Legacy contracts keep their seat count.",
      status: "confirmed",
      evidence: ["doc:memo"],
    },
    { id: "rule-discount", rule: "Discounts above 25% need approval.", status: "conflicting" },
  ],
  unknowns: [
    { id: "gap-approver", question: "Who approves nonstandard entitlements?", status: "open" },
    { id: "gap-done", question: "Which billing system?", status: "answered" },
  ],
  clarifications: [
    { id: "call_1", question: "Discount threshold?", transcript: "User: 20 percent." },
  ],
};

describe("knowledge views", () => {
  test("search keeps each fact's evidence", () => {
    const [top] = rank(flatten(acme), "legacy seats", 5);
    expect(top).toMatchObject({ kind: "business_rule", id: "rule-legacy", evidence: ["doc:memo"] });
  });

  test("search matches word forms (approvals finds approval and approves)", () => {
    expect(rank(flatten(acme), "approvals", 10).map((i) => i.id)).toEqual([
      "rule-discount",
      "gap-approver",
    ]);
  });

  test("never presents a conflicting rule or an open unknown as settled", () => {
    const view = requirementsFor(acme);
    expect(view.unresolved.map((i) => i.id).sort()).toEqual(["gap-approver", "rule-discount"]);
    expect(view.answers_from_clarifications.map((i) => i.id)).toEqual(["call_1"]);
  });

  test("overview lists only open unknowns", () => {
    expect(overview(acme, "acme").open_unknowns.map((u) => u.id)).toEqual(["gap-approver"]);
  });

  test("the session briefing names the client and the ask-don't-guess rule", () => {
    const text = sessionBriefing(acme, "acme");
    expect(text).toContain('"acme" (Acme)');
    expect(text).toContain("1 open unknowns");
    expect(text).toContain("instead of guessing");
  });
});
