import type { BotRequest } from "./routes";

export type VexaConfig = {
  apiKey: string;
  /** `https://api.cloud.vexa.ai` (hosted) or a self-hosted gateway. */
  apiUrl: string;
};

const BOT_NAME = "Ouro notetaker";
const REQUEST_TIMEOUT_MS = 15_000;
// Vexa ends a bot's meeting once it hears no remote audio for this long.
// Its default is 10 minutes, which kept the notetaker in an ended call; two
// minutes leaves soon after everyone goes, at the cost of also leaving a
// meeting that falls fully silent for that long.
const LEFT_ALONE_MS = 2 * 60_000;

/** Vexa's REST API: send a bot, read a meeting's transcript record. */
export function createVexaClient(config: VexaConfig, send: typeof fetch = fetch) {
  const call = (path: string, init: RequestInit = {}) =>
    send(new URL(path, config.apiUrl), {
      ...init,
      headers: {
        "x-api-key": config.apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

  return {
    /**
     * Sends a passive bot: a visible name, admitted by the host, English
     * transcription, no audio kept. It never speaks or chats.
     */
    async sendBot(code: string): Promise<BotRequest> {
      try {
        const response = await call("/bots", {
          method: "POST",
          body: JSON.stringify({
            platform: "google_meet",
            native_meeting_id: code,
            bot_name: BOT_NAME,
            language: "en",
            transcribe_enabled: true,
            recording_enabled: false,
            automatic_leave: { max_time_left_alone: LEFT_ALONE_MS },
          }),
        });
        return await readBotResponse(response);
      } catch (error) {
        console.error("Vexa send bot request failed", error);
        return {
          ok: false,
          outcome: "unconfirmed",
          message:
            "Vexa did not answer, so the notetaker may or may not be on its way. This page updates if it joins.",
        };
      }
    },

    /**
     * The meeting record with its segments: by Vexa's meeting id when known
     * (a recurring Meet code names many meetings), else by meeting code.
     */
    async readTranscript({
      code,
      meetingId,
    }: {
      code: string;
      meetingId: string | null;
    }): Promise<unknown> {
      const path = meetingId
        ? `/transcripts/by-id/${encodeURIComponent(meetingId)}`
        : `/transcripts/google_meet/${encodeURIComponent(code)}`;
      const response = await call(path);
      if (!response.ok) throw new Error(`Vexa transcript read answered ${response.status}`);
      return response.json();
    },
  };
}

export type VexaClient = ReturnType<typeof createVexaClient>;

async function readBotResponse(response: Response): Promise<BotRequest> {
  const body: unknown = await response.json().catch(() => null);
  if (response.ok) {
    const id = (body as { id?: unknown } | null)?.id;
    if (typeof id === "number" || typeof id === "string") return { ok: true, botId: String(id) };
    return {
      ok: false,
      outcome: "unconfirmed",
      message: "Vexa accepted the request but returned no meeting id.",
    };
  }
  console.error(`Vexa send bot answered ${response.status}`, body);
  const refused = (message: string): BotRequest => ({ ok: false, outcome: "refused", message });
  switch (response.status) {
    case 401:
      return refused("Vexa rejected the server's API key (VEXA_API_KEY).");
    case 403:
    case 429:
      return refused(
        "Vexa's concurrent-bot limit is reached. Stop another bot or try again later.",
      );
    case 409:
      return refused(
        "A Vexa bot is already in this meeting. Stop it in Vexa or wait for it to leave.",
      );
    case 422:
    case 503:
      return refused(`Vexa could not start a notetaker: ${detail(body)}`);
    default:
      return {
        ok: false,
        outcome: "unconfirmed",
        message: `Vexa answered HTTP ${response.status}; the notetaker may still join. This page updates if it does.`,
      };
  }
}

/** FastAPI's `detail`, a string or a list of `{ msg }`. */
function detail(body: unknown): string {
  const value = (body as { detail?: unknown } | null)?.detail;
  if (typeof value === "string" && value.trim()) return value.trim();
  const first = Array.isArray(value) ? (value[0] as { msg?: unknown } | undefined)?.msg : undefined;
  return typeof first === "string" ? first : "check the meeting link.";
}
