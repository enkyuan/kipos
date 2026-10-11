// The Dial REST API (https://docs.getdial.ai), only the calls this service makes.

export type DialCall = {
  id: string;
  to: string;
  status?: { state?: string; terminationType?: string | null; label?: string };
  duration?: number | null;
  transcript?: string | null;
  transcriptTurns?: { speaker: string; text: string }[] | null;
  instruction?: string | null;
  createdAt: string;
};

export type DialMessage = {
  id: string;
  to: string | null;
  from: string;
  body: string;
  direction: "inbound" | "outbound";
  status: string;
  statusError?: string | null;
  createdAt: string;
};

export class DialError extends Error {
  constructor(
    readonly status: number,
    body: unknown,
  ) {
    const detail = (body as { error?: unknown })?.error ?? body;
    super(`Dial ${status}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
  }
}

type DialRequest = { method?: string; body?: unknown; headers?: Record<string, string> };

async function dial<T>(path: string, request: DialRequest = {}): Promise<T> {
  const key = process.env.DIAL_API_KEY;
  if (!key) throw new Error("DIAL_API_KEY is not set");
  const base = process.env.DIAL_API_URL ?? "https://api.getdial.ai";
  const res = await fetch(`${base}/api/v1${path}`, {
    method: request.method ?? "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      ...(request.body ? { "Content-Type": "application/json" } : {}),
      ...request.headers,
    },
    body: request.body ? JSON.stringify(request.body) : undefined,
  });
  const text = await res.text();
  const json: unknown = text ? JSON.parse(text) : {};
  if (!res.ok) throw new DialError(res.status, json);
  return json as T;
}

let cachedNumberId: string | undefined;

// Calls and texts go out from DIAL_FROM_NUMBER, or the account's first number
// that can place calls.
async function fromNumber(): Promise<string> {
  if (process.env.DIAL_FROM_NUMBER) return process.env.DIAL_FROM_NUMBER;
  if (cachedNumberId) return cachedNumberId;
  const { numbers } = await dial<{
    numbers: { id: string; callingEnabled: boolean; setupStatus: string }[];
  }>("/numbers");
  const usable = numbers.find((n) => n.callingEnabled && n.setupStatus === "ready");
  if (!usable) throw new Error("No Dial number on this account can place calls");
  cachedNumberId = usable.id;
  return usable.id;
}

export async function placeCall(call: {
  to: string;
  instruction: string;
  idempotencyKey?: string;
}): Promise<DialCall> {
  const { call: placed } = await dial<{ call: DialCall }>("/calls", {
    method: "POST",
    headers: call.idempotencyKey ? { "Idempotency-Key": call.idempotencyKey } : {},
    body: {
      to: call.to,
      fromNumber: await fromNumber(),
      outboundInstruction: call.instruction,
      language: "en-US",
      // A clarification is one question; three minutes is plenty.
      maxCallDurationSeconds: 180,
    },
  });
  return placed;
}

export async function getCall(id: string): Promise<DialCall> {
  return (await dial<{ call: DialCall }>(`/calls/${encodeURIComponent(id)}`)).call;
}

export async function listCalls(): Promise<DialCall[]> {
  return (await dial<{ calls?: DialCall[] }>("/calls?direction=outbound")).calls ?? [];
}

export async function stopCall(id: string): Promise<void> {
  await dial(`/calls/${encodeURIComponent(id)}/stop`, { method: "POST" });
}

export async function sendMessage(to: string, body: string): Promise<DialMessage> {
  const sent = await dial<{ message: DialMessage }>("/messages", {
    method: "POST",
    body: { to, fromNumber: await fromNumber(), body },
  });
  return sent.message;
}

export async function listMessages(filter: Record<string, string>): Promise<DialMessage[]> {
  const query = new URLSearchParams(filter).toString();
  return (await dial<{ messages?: DialMessage[] }>(`/messages?${query}`)).messages ?? [];
}
