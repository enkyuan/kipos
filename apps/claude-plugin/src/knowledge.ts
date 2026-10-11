// Company knowledge as served by GET /knowledge, and the views of it that the
// MCP tools return. Pure functions: no network, no environment.

type Sourced = { id: string; evidence?: string[] };

export type Knowledge = {
  engagement_id?: string;
  company?: { name?: string; summary?: string };
  processes?: (Sourced & { name: string; owner: string; steps?: string[] })[];
  pain_points?: (Sourced & { statement: string; impact?: string })[];
  requirements?: (Sourced & { statement: string; status?: string })[];
  business_rules?: (Sourced & {
    rule: string;
    condition?: string;
    action?: string;
    status?: string;
  })[];
  stakeholders?: { id: string; name: string; role: string; owns?: string[] }[];
  unknowns?: {
    id: string;
    question: string;
    why_it_matters?: string;
    likely_owner?: string;
    status?: string;
  }[];
  opportunities?: {
    id: string;
    title: string;
    rationale: string;
    suggested_implementation?: string;
  }[];
  recommended_solution?: unknown;
  clarifications?: (Sourced & { question: string; transcript?: string; stakeholder?: unknown })[];
};

export type Item = {
  kind: string;
  id: string;
  text: string;
  status?: string;
  [detail: string]: unknown;
};

// Every fact as one searchable item that keeps its evidence.
export function flatten(k: Knowledge): Item[] {
  return [
    ...(k.processes ?? []).map((p) => ({
      kind: "process",
      id: p.id,
      text: `${p.name} (owner: ${p.owner}): ${(p.steps ?? []).join(" -> ")}`,
      evidence: p.evidence,
    })),
    ...(k.pain_points ?? []).map(({ statement, ...p }) => ({
      kind: "pain_point",
      text: statement,
      ...p,
    })),
    ...(k.requirements ?? []).map(({ statement, ...r }) => ({
      kind: "requirement",
      text: statement,
      ...r,
    })),
    ...(k.business_rules ?? []).map(({ rule, ...r }) => ({
      kind: "business_rule",
      text: rule,
      ...r,
    })),
    ...(k.stakeholders ?? []).map((s) => ({
      kind: "stakeholder",
      id: s.id,
      text: `${s.name}, ${s.role}; owns ${(s.owns ?? []).join(", ")}`,
    })),
    ...(k.unknowns ?? []).map(({ question, ...u }) => ({ kind: "unknown", text: question, ...u })),
    ...(k.opportunities ?? []).map((o) => ({
      kind: "opportunity",
      id: o.id,
      text: `${o.title}: ${o.rationale}`,
    })),
    ...(k.clarifications ?? []).map(({ question, transcript, ...c }) => ({
      kind: "clarification_answer",
      text: `Q: ${question}\nConversation: ${transcript ?? ""}`,
      ...c,
    })),
  ];
}

// Crude stemming (first six letters) so "approvals", "approval" and "approve"
// match each other; good enough for a knowledge base of hundreds of facts.
const terms = (s: string) =>
  (s.toLowerCase().match(/[a-z0-9$%]+/g) ?? [])
    .filter((t) => t.length > 2)
    .map((t) => t.slice(0, 6));

export function rank(items: Item[], query: string, limit: number): Item[] {
  const asked = new Set(terms(query));
  const score = (it: Item) =>
    terms(`${it.text} ${String(it.condition ?? "")} ${String(it.action ?? "")}`).filter((t) =>
      asked.has(t),
    ).length;
  return items
    .map((it) => ({ it, s: score(it) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.it);
}

const isOpen = (u: { status?: string }) => u.status !== "answered";

export function overview(k: Knowledge, engagementId: string) {
  return {
    engagement_id: k.engagement_id ?? engagementId,
    company: k.company,
    processes: (k.processes ?? []).map(({ id, name, owner, steps }) => ({
      id,
      name,
      owner,
      steps,
    })),
    pain_points: k.pain_points,
    opportunities: k.opportunities,
    recommended_solution: k.recommended_solution,
    stakeholders: k.stakeholders,
    open_unknowns: (k.unknowns ?? []).filter(isOpen),
    answered_clarifications: (k.clarifications ?? []).length,
  };
}

// What implementation must follow. Conflicting rules and open unknowns are
// listed as unresolved so they are never mistaken for settled rules.
export function requirementsFor(k: Knowledge, topic?: string) {
  const relevant = flatten(k).filter((i) =>
    ["requirement", "business_rule", "clarification_answer", "unknown"].includes(i.kind),
  );
  const picked = topic ? rank(relevant, topic, 50) : relevant;
  const of = (kind: string) => picked.filter((i) => i.kind === kind);
  return {
    topic: topic ?? "all",
    requirements: of("requirement"),
    business_rules: of("business_rule"),
    answers_from_clarifications: of("clarification_answer"),
    unresolved: picked.filter(
      (i) => (i.kind === "unknown" && isOpen(i)) || i.status === "conflicting",
    ),
  };
}

// One paragraph for the start of every session.
export function sessionBriefing(k: Knowledge, engagementId: string): string {
  const open = (k.unknowns ?? []).filter(isOpen).length;
  return [
    `Superpower is active for client engagement "${engagementId}" (${k.company?.name ?? "unknown company"}).`,
    k.company?.summary ? `Business: ${k.company.summary}` : "",
    `Known: ${(k.requirements ?? []).length} requirements, ${(k.business_rules ?? []).length} business rules, ${open} open unknowns, ${(k.clarifications ?? []).length} finished clarifications.`,
    "Before implementing client business logic, use the superpower skill: read context and requirements from the Superpower MCP tools, and request a clarification instead of guessing any missing business rule.",
  ]
    .filter(Boolean)
    .join("\n");
}
