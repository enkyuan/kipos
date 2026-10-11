import type { BusinessRequirement, CandidateIssue } from "./contract";
import type { ModelOutput } from "./model-output";

type RequirementOutput = ModelOutput["requirements"][number];
type IssueOutput = ModelOutput["issues"][number];

/** An issue as stored: with the newest utterance id at the moment it was dismissed. */
export type StoredIssue = CandidateIssue & { dismissedAtUtteranceId: number | null };

export type Known = {
  requirements: BusinessRequirement[];
  issues: StoredIssue[];
  /** Every utterance id in this meeting: evidence must be one of them. */
  utteranceIds: ReadonlySet<number>;
};

export type Plan = {
  requirements: BusinessRequirement[];
  issues: StoredIssue[];
  /** Model records that were not applied, and why (logged). */
  rejected: string[];
};

type Context = { sessionId: string; now: string; newId: () => string };

/** The working set while a plan is built: records by id, updated in place. */
type Draft = {
  requirements: Map<string, BusinessRequirement>;
  issues: Map<string, StoredIssue>;
  context: Context;
  plan: Plan;
};

const union = (a: number[], b: number[]) => [...new Set([...a, ...b])].sort((x, y) => x - y);
const newest = (ids: number[]) => (ids.length ? Math.max(...ids) : 0);

const STOPWORDS = new Set(
  "the and for are was with that this what which who how when does will should from have has not any".split(
    " ",
  ),
);
const words = (text: string) =>
  new Set(
    text
      .toLowerCase()
      .match(/[a-z0-9$%]+/g)
      ?.filter((w) => w.length > 2 && !STOPWORDS.has(w)) ?? [],
  );

/** Word overlap (Jaccard) between two short texts, 0..1. */
export function similarity(a: string, b: string): number {
  const left = words(a);
  const right = words(b);
  const shared = [...left].filter((word) => right.has(word)).length;
  const total = new Set([...left, ...right]).size;
  return total === 0 ? 0 : shared / total;
}

/**
 * Turns a validated model answer into the records to write, enforcing what
 * the model is not trusted with: evidence must exist, a duplicate updates
 * the original, a dismissed issue returns only with evidence newer than
 * its dismissal, an answered question is never created, and a requirement
 * is `confirmed` only with a participant's explicit confirmation on record.
 */
export function planChanges(output: ModelOutput, known: Known, context: Context): Plan {
  const plan: Plan = { requirements: [], issues: [], rejected: [] };
  const draft: Draft = {
    requirements: new Map(known.requirements.map((r) => [r.id, r])),
    issues: new Map(known.issues.map((i) => [i.id, i])),
    context,
    plan,
  };
  const unknown = (ids: number[]) => ids.filter((id) => !known.utteranceIds.has(id));

  for (const item of output.requirements) {
    const missing = unknown([...item.evidenceUtteranceIds, ...item.confirmedByUtteranceIds]);
    if (missing.length) {
      plan.rejected.push(
        `requirement "${item.description}": unknown evidence ${missing.join(", ")}`,
      );
      continue;
    }
    for (const record of planRequirement(item, draft)) draft.requirements.set(record.id, record);
  }
  for (const item of output.issues) {
    const missing = unknown([...item.evidenceUtteranceIds, ...item.resolvedByUtteranceIds]);
    if (missing.length) {
      plan.rejected.push(`issue "${item.summary}": unknown evidence ${missing.join(", ")}`);
      continue;
    }
    const record = planIssue(item, draft);
    if (record) draft.issues.set(record.id, record);
  }
  plan.requirements = [...draft.requirements.values()].filter(
    (r) => !known.requirements.includes(r),
  );
  plan.issues = [...draft.issues.values()].filter((i) => !known.issues.includes(i));
  return plan;
}

function findRequirement(item: RequirementOutput, requirements: Map<string, BusinessRequirement>) {
  if (item.ref) return requirements.get(item.ref) ?? null;
  // A restatement of a recorded requirement updates it rather than adding a copy.
  return (
    [...requirements.values()].find(
      (r) => r.status !== "superseded" && similarity(r.description, item.description) >= 0.6,
    ) ?? null
  );
}

function planRequirement(
  item: RequirementOutput,
  { requirements, context, plan }: Draft,
): BusinessRequirement[] {
  const existing = findRequirement(item, requirements);
  if (item.ref && !existing) {
    plan.rejected.push(`requirement ref ${item.ref} does not exist`);
    return [];
  }
  if (existing?.status === "superseded") return [];
  const record = mergeRequirement(existing, item, context);
  const replaced = item.supersedes ? requirements.get(item.supersedes) : undefined;
  if (!replaced || replaced.id === record.id || replaced.status === "superseded") return [record];
  return [
    record,
    { ...replaced, status: "superseded", supersededBy: record.id, updatedAt: context.now },
  ];
}

/** A new requirement, or an existing one with its evidence added to (never replaced). */
function mergeRequirement(
  existing: BusinessRequirement | null,
  item: RequirementOutput,
  { sessionId, now, newId }: Context,
): BusinessRequirement {
  const confirmation = union(
    existing?.confirmationUtteranceIds ?? [],
    item.confirmedByUtteranceIds,
  );
  return {
    id: existing?.id ?? newId(),
    meetingSessionId: sessionId,
    description: item.description,
    status: confirmation.length > 0 ? "confirmed" : "proposed",
    evidenceUtteranceIds: union(existing?.evidenceUtteranceIds ?? [], item.evidenceUtteranceIds),
    confirmationUtteranceIds: confirmation,
    supersededBy: null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function findIssue(item: IssueOutput, issues: Map<string, StoredIssue>) {
  if (item.ref) return issues.get(item.ref) ?? null;
  // The same question in other words is the same issue.
  return (
    [...issues.values()].find(
      (issue) =>
        issue.type === item.type &&
        (similarity(issue.summary, item.summary) >= 0.5 ||
          similarity(issue.suggestedQuestion, item.suggestedQuestion) >= 0.6),
    ) ?? null
  );
}

function planIssue(item: IssueOutput, { issues, context, plan }: Draft): StoredIssue | null {
  const { sessionId, now, newId } = context;
  const existing = findIssue(item, issues);
  if (item.ref && !existing) {
    plan.rejected.push(`issue ref ${item.ref} does not exist`);
    return null;
  }
  const answered = item.resolvedByUtteranceIds.length > 0;
  if (!existing) {
    // A question the conversation already answered is not an issue.
    return answered
      ? null
      : {
          id: newId(),
          meetingSessionId: sessionId,
          ...fields(item),
          evidenceUtteranceIds: union([], item.evidenceUtteranceIds),
          resolutionUtteranceIds: [],
          status: "open",
          dismissedAtUtteranceId: null,
          savedAt: null,
          createdAt: now,
          updatedAt: now,
        };
  }
  return updateIssue(existing, item, now);
}

const fields = (item: IssueOutput) => ({
  type: item.type,
  summary: item.summary,
  implementationImpact: item.implementationImpact,
  suggestedQuestion: item.suggestedQuestion,
  suggestedOwner: item.suggestedOwner,
  priority: item.priority,
});

/** Applies new evidence to a recorded issue, respecting dismissal and resolution. */
function updateIssue(existing: StoredIssue, item: IssueOutput, now: string): StoredIssue | null {
  // A dismissed or resolved issue changes only on evidence newer than that decision.
  const watermark = {
    open: 0,
    dismissed: existing.dismissedAtUtteranceId ?? newest(existing.evidenceUtteranceIds),
    resolved: newest(existing.resolutionUtteranceIds),
  }[existing.status];
  const cited = [...item.evidenceUtteranceIds, ...item.resolvedByUtteranceIds];
  if (!cited.some((id) => id > watermark)) return null;

  // An answer counts only if it came after the question first arose.
  const raised = Math.min(...existing.evidenceUtteranceIds);
  const resolves = item.resolvedByUtteranceIds.some((id) => id > raised);
  const updated: StoredIssue = {
    ...existing,
    ...fields(item),
    // The original evidence is preserved; new evidence is added to it.
    evidenceUtteranceIds: union(existing.evidenceUtteranceIds, item.evidenceUtteranceIds),
    resolutionUtteranceIds: resolves
      ? union(existing.resolutionUtteranceIds, item.resolvedByUtteranceIds)
      : existing.resolutionUtteranceIds,
    status: resolves ? "resolved" : "open",
    updatedAt: existing.updatedAt,
  };
  // A restatement that changes nothing is not an update.
  return JSON.stringify(updated) === JSON.stringify(existing)
    ? null
    : { ...updated, updatedAt: now };
}
