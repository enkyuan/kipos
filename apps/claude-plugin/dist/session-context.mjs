/* oxlint-disable -- generated bundle */
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};

// src/knowledge.ts
function flatten(k) {
  return [
    ...(k.processes ?? []).map((p) => ({
      kind: "process",
      id: p.id,
      text: `${p.name} (owner: ${p.owner}): ${(p.steps ?? []).join(" -> ")}`,
      evidence: p.evidence
    })),
    ...(k.pain_points ?? []).map(({ statement, ...p }) => ({
      kind: "pain_point",
      text: statement,
      ...p
    })),
    ...(k.requirements ?? []).map(({ statement, ...r }) => ({
      kind: "requirement",
      text: statement,
      ...r
    })),
    ...(k.business_rules ?? []).map(({ rule, ...r }) => ({
      kind: "business_rule",
      text: rule,
      ...r
    })),
    ...(k.stakeholders ?? []).map((s) => ({
      kind: "stakeholder",
      id: s.id,
      text: `${s.name}, ${s.role}; owns ${(s.owns ?? []).join(", ")}`
    })),
    ...(k.unknowns ?? []).map(({ question, ...u }) => ({ kind: "unknown", text: question, ...u })),
    ...(k.opportunities ?? []).map((o) => ({
      kind: "opportunity",
      id: o.id,
      text: `${o.title}: ${o.rationale}`
    })),
    ...(k.clarifications ?? []).map(({ question, transcript, ...c }) => ({
      kind: "clarification_answer",
      text: `Q: ${question}
Conversation: ${transcript ?? ""}`,
      ...c
    }))
  ];
}
var terms = (s) => (s.toLowerCase().match(/[a-z0-9$%]+/g) ?? []).filter((t) => t.length > 2).map((t) => t.slice(0, 6));
function rank(items, query, limit) {
  const asked = new Set(terms(query));
  const score = (it) => terms(`${it.text} ${String(it.condition ?? "")} ${String(it.action ?? "")}`).filter((t) => asked.has(t)).length;
  return items.map((it) => ({ it, s: score(it) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.it);
}
var isOpen = (u) => u.status !== "answered";
function overview(k, engagementId) {
  return {
    engagement_id: k.engagement_id ?? engagementId,
    company: k.company,
    processes: (k.processes ?? []).map(({ id, name, owner, steps }) => ({
      id,
      name,
      owner,
      steps
    })),
    pain_points: k.pain_points,
    opportunities: k.opportunities,
    recommended_solution: k.recommended_solution,
    stakeholders: k.stakeholders,
    open_unknowns: (k.unknowns ?? []).filter(isOpen),
    answered_clarifications: (k.clarifications ?? []).length
  };
}
function requirementsFor(k, topic) {
  const relevant = flatten(k).filter((i) => ["requirement", "business_rule", "clarification_answer", "unknown"].includes(i.kind));
  const picked = topic ? rank(relevant, topic, 50) : relevant;
  const of = (kind) => picked.filter((i) => i.kind === kind);
  return {
    topic: topic ?? "all",
    requirements: of("requirement"),
    business_rules: of("business_rule"),
    answers_from_clarifications: of("clarification_answer"),
    unresolved: picked.filter((i) => i.kind === "unknown" && isOpen(i) || i.status === "conflicting")
  };
}
function sessionBriefing(k, engagementId) {
  const open = (k.unknowns ?? []).filter(isOpen).length;
  return [
    `Superpower is active for client engagement "${engagementId}" (${k.company?.name ?? "unknown company"}).`,
    k.company?.summary ? `Business: ${k.company.summary}` : "",
    `Known: ${(k.requirements ?? []).length} requirements, ${(k.business_rules ?? []).length} business rules, ${open} open unknowns, ${(k.clarifications ?? []).length} finished clarifications.`,
    "Before implementing client business logic, use the superpower skill: read context and requirements from the Superpower MCP tools, and request a clarification instead of guessing any missing business rule."
  ].filter(Boolean).join(`
`);
}

// src/superpower-api.ts
var option = (value) => value && !value.startsWith("${") ? value.trim() : "";
var withoutSlash = (url) => url.replace(/\/+$/, "");
function readSettings(env) {
  const apiUrl = withoutSlash(option(env.SUPERPOWER_API_URL));
  return {
    apiUrl,
    knowledgeUrl: withoutSlash(option(env.SUPERPOWER_KNOWLEDGE_URL)) || apiUrl,
    token: option(env.SUPERPOWER_TOKEN),
    engagementId: option(env.SUPERPOWER_ENGAGEMENT_ID) || "acme",
    requester: option(env.SUPERPOWER_REQUESTER) || "the engineering team"
  };
}

class SuperpowerError extends Error {
  detail;
  constructor(message, detail = {}) {
    super(message);
    this.detail = detail;
  }
}
async function request(settings, url, call = {}) {
  if (!url) {
    throw new SuperpowerError("Superpower is not configured: set the plugin's api_url (/plugin → superpower → configure).");
  }
  const target = new URL(url);
  target.searchParams.set("engagement_id", settings.engagementId);
  const res = await fetch(target, {
    method: call.method ?? "GET",
    signal: call.signal,
    headers: {
      Authorization: `Bearer ${settings.token}`,
      "X-Engagement-Id": settings.engagementId,
      ...call.body ? { "Content-Type": "application/json" } : {}
    },
    body: call.body ? JSON.stringify({ engagement_id: settings.engagementId, ...call.body }) : undefined
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok)
    throw new SuperpowerError(String(data.error ?? `HTTP ${res.status}`), data);
  return data;
}

// src/session-context.ts
var opt = (key) => process.env[`CLAUDE_PLUGIN_OPTION_${key}`];
var settings = readSettings({
  SUPERPOWER_API_URL: opt("API_URL"),
  SUPERPOWER_KNOWLEDGE_URL: opt("KNOWLEDGE_URL"),
  SUPERPOWER_TOKEN: opt("API_TOKEN"),
  SUPERPOWER_ENGAGEMENT_ID: opt("ENGAGEMENT_ID")
});
try {
  const k = await request(settings, `${settings.knowledgeUrl}/knowledge`, {
    signal: AbortSignal.timeout(4000)
  });
  const additionalContext = sessionBriefing(k, settings.engagementId);
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext } }));
} catch {}
