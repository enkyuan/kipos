import { describe, expect, test } from "bun:test";
import type { BusinessRequirement } from "./contract";
import type { ModelOutput } from "./model-output";
import { planChanges, similarity, type Known, type StoredIssue } from "./plan";

let counter = 0;
const context = { sessionId: "s1", now: "2026-10-11T10:05:00Z", newId: () => `new-${++counter}` };
const ids = (...values: number[]) => new Set(values);

const issueOut = (
  overrides: Partial<ModelOutput["issues"][number]> = {},
): ModelOutput["issues"][number] => ({
  ref: null,
  type: "missing_business_rule",
  summary: "Refund approval threshold not specified",
  implementationImpact:
    "The approval workflow cannot be built without the amount that triggers it.",
  suggestedQuestion: "Above what refund amount is approval required?",
  suggestedOwner: null,
  evidenceUtteranceIds: [3],
  priority: "high",
  resolvedByUtteranceIds: [],
  ...overrides,
});

const storedIssue = (overrides: Partial<StoredIssue> = {}): StoredIssue => ({
  id: "issue-1",
  meetingSessionId: "s1",
  type: "missing_business_rule",
  summary: "Refund approval threshold not specified",
  implementationImpact:
    "The approval workflow cannot be built without the amount that triggers it.",
  suggestedQuestion: "Above what refund amount is approval required?",
  suggestedOwner: null,
  evidenceUtteranceIds: [3],
  resolutionUtteranceIds: [],
  priority: "high",
  status: "open",
  dismissedAtUtteranceId: null,
  savedAt: null,
  createdAt: "2026-10-11T10:02:00Z",
  updatedAt: "2026-10-11T10:02:00Z",
  ...overrides,
});

const requirement = (overrides: Partial<BusinessRequirement> = {}): BusinessRequirement => ({
  id: "req-1",
  meetingSessionId: "s1",
  description: "Large refunds need manager approval",
  status: "proposed",
  evidenceUtteranceIds: [3],
  confirmationUtteranceIds: [],
  supersededBy: null,
  createdAt: "2026-10-11T10:02:00Z",
  updatedAt: "2026-10-11T10:02:00Z",
  ...overrides,
});

const known = (overrides: Partial<Known> = {}): Known => ({
  requirements: [],
  issues: [],
  utteranceIds: ids(1, 2, 3, 4, 5, 6, 7, 8, 9),
  ...overrides,
});

const plan = (output: Partial<ModelOutput>, state: Known = known()) =>
  planChanges({ requirements: [], issues: [], ...output }, state, context);

describe("planChanges: what gets recorded", () => {
  test("an empty answer changes nothing", () => {
    expect(plan({})).toEqual({ requirements: [], issues: [], rejected: [] });
  });

  test("rejects any record citing evidence that is not in the transcript", () => {
    const result = plan({
      issues: [issueOut({ evidenceUtteranceIds: [3, 99] })],
      requirements: [
        {
          ref: null,
          description: "x",
          evidenceUtteranceIds: [42],
          confirmedByUtteranceIds: [],
          supersedes: null,
        },
      ],
    });
    expect(result.issues).toEqual([]);
    expect(result.requirements).toEqual([]);
    expect(result.rejected).toHaveLength(2);
  });

  test("a requirement is proposed unless a participant's confirmation is cited", () => {
    const proposed = plan({
      requirements: [
        {
          ref: null,
          description: "Refunds over $200 need approval",
          evidenceUtteranceIds: [5],
          confirmedByUtteranceIds: [],
          supersedes: null,
        },
      ],
    });
    expect(proposed.requirements[0]).toMatchObject({
      status: "proposed",
      confirmationUtteranceIds: [],
    });
    const confirmed = plan({
      requirements: [
        {
          ref: null,
          description: "Refunds over $200 need approval",
          evidenceUtteranceIds: [5],
          confirmedByUtteranceIds: [6],
          supersedes: null,
        },
      ],
    });
    expect(confirmed.requirements[0]).toMatchObject({
      status: "confirmed",
      confirmationUtteranceIds: [6],
    });
  });

  test("a replaced requirement is marked superseded by its replacement", () => {
    const result = plan(
      {
        requirements: [
          {
            ref: null,
            description: "Refunds over $500 need approval",
            evidenceUtteranceIds: [8],
            confirmedByUtteranceIds: [],
            supersedes: "req-1",
          },
        ],
      },
      known({ requirements: [requirement()] }),
    );
    const replacement = result.requirements.find((r) => r.id !== "req-1")!;
    expect(result.requirements.find((r) => r.id === "req-1")).toMatchObject({
      status: "superseded",
      supersededBy: replacement.id,
    });
  });
});

describe("planChanges: keeping issues current", () => {
  test("a repeated mention, by ref or in other words, updates the existing issue", () => {
    const state = known({ issues: [storedIssue()] });
    const byRef = plan(
      { issues: [issueOut({ ref: "issue-1", evidenceUtteranceIds: [6] })] },
      state,
    );
    const reworded = plan(
      {
        issues: [
          issueOut({
            summary: "Refund approval threshold is not specified yet",
            evidenceUtteranceIds: [6],
          }),
        ],
      },
      state,
    );
    for (const result of [byRef, reworded]) {
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({ id: "issue-1", evidenceUtteranceIds: [3, 6] });
    }
  });

  test("a later answer resolves the issue and keeps its original evidence", () => {
    const result = plan(
      {
        issues: [
          issueOut({ ref: "issue-1", evidenceUtteranceIds: [3], resolvedByUtteranceIds: [7] }),
        ],
      },
      known({ issues: [storedIssue()] }),
    );
    expect(result.issues[0]).toMatchObject({
      status: "resolved",
      evidenceUtteranceIds: [3],
      resolutionUtteranceIds: [7],
    });
  });

  test("never creates an issue for a question the conversation already answered", () => {
    expect(plan({ issues: [issueOut({ resolvedByUtteranceIds: [4] })] }).issues).toEqual([]);
  });

  test("a dismissed issue stays dismissed without evidence newer than the dismissal", () => {
    const state = known({
      issues: [storedIssue({ status: "dismissed", dismissedAtUtteranceId: 6 })],
    });
    expect(
      plan({ issues: [issueOut({ ref: "issue-1", evidenceUtteranceIds: [3, 5] })] }, state).issues,
    ).toEqual([]);
    expect(plan({ issues: [issueOut({ evidenceUtteranceIds: [4] })] }, state).issues).toEqual([]);
    const reopened = plan(
      { issues: [issueOut({ ref: "issue-1", evidenceUtteranceIds: [8] })] },
      state,
    );
    expect(reopened.issues[0]).toMatchObject({
      id: "issue-1",
      status: "open",
      evidenceUtteranceIds: [3, 8],
    });
  });

  test("a restatement that changes nothing produces no update", () => {
    const state = known({ issues: [storedIssue()] });
    expect(plan({ issues: [issueOut({ ref: "issue-1" })] }, state).issues).toEqual([]);
  });

  test("rejects a ref to a record that does not exist", () => {
    const result = plan({ issues: [issueOut({ ref: "nope" })] });
    expect(result.issues).toEqual([]);
    expect(result.rejected).toEqual(["issue ref nope does not exist"]);
  });
});

test("similarity compares the words that carry meaning", () => {
  expect(
    similarity("Refund approval threshold missing", "Missing threshold for refund approval"),
  ).toBeGreaterThan(0.6);
  expect(similarity("Refund approval threshold", "CRM integration credentials")).toBe(0);
});
