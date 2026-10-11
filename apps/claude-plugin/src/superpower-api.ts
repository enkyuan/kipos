// The plugin's one boundary to the network: the dial service (calls, texts,
// stakeholders) and the knowledge backend (GET /knowledge). Every request
// carries the engagement, so a session for one client never sees another's.

export type Settings = {
  apiUrl: string;
  knowledgeUrl: string;
  token: string;
  engagementId: string;
  requester: string;
};

// Claude Code leaves an unset userConfig reference as the literal
// "${user_config.key}"; treat that like an empty value.
const option = (value: string | undefined) =>
  value && !value.startsWith("${") ? value.trim() : "";
const withoutSlash = (url: string) => url.replace(/\/+$/, "");

export function readSettings(env: Record<string, string | undefined>): Settings {
  const apiUrl = withoutSlash(option(env.SUPERPOWER_API_URL));
  return {
    apiUrl,
    knowledgeUrl: withoutSlash(option(env.SUPERPOWER_KNOWLEDGE_URL)) || apiUrl,
    token: option(env.SUPERPOWER_TOKEN),
    engagementId: option(env.SUPERPOWER_ENGAGEMENT_ID) || "acme",
    requester: option(env.SUPERPOWER_REQUESTER) || "the engineering team",
  };
}

export class SuperpowerError extends Error {
  constructor(
    message: string,
    readonly detail: object = {},
  ) {
    super(message);
  }
}

type Call = { method?: "GET" | "POST"; body?: object; signal?: AbortSignal };

export async function request<T>(settings: Settings, url: string, call: Call = {}): Promise<T> {
  if (!url) {
    throw new SuperpowerError(
      "Superpower is not configured: set the plugin's api_url (/plugin → superpower → configure).",
    );
  }
  const target = new URL(url);
  target.searchParams.set("engagement_id", settings.engagementId);
  const res = await fetch(target, {
    method: call.method ?? "GET",
    signal: call.signal,
    headers: {
      Authorization: `Bearer ${settings.token}`,
      "X-Engagement-Id": settings.engagementId,
      ...(call.body ? { "Content-Type": "application/json" } : {}),
    },
    body: call.body
      ? JSON.stringify({ engagement_id: settings.engagementId, ...call.body })
      : undefined,
  });
  const text = await res.text();
  let data: Record<string, unknown>;
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) throw new SuperpowerError(String(data.error ?? `HTTP ${res.status}`), data);
  return data as T;
}
