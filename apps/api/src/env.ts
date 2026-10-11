/** Process configuration, read once at startup by `server.ts`. */
export type Env = {
  port: number;
  databasePath: string;
  vexa: { apiKey: string; apiUrl: string; webhookSecret: string };
  /** Null when no model key is set: transcripts still work, analysis is off. */
  analysis: { apiKey: string; model: string } | null;
};

type Source = Record<string, string | undefined>;

const DEFAULT_ANALYSIS_MODEL = "claude-sonnet-5-5";

/**
 * Parses configuration from environment variables. Local paths and ports
 * have development defaults; the Vexa key does not, because without it no
 * meeting can be shadowed. Anything present but invalid fails startup
 * rather than falling back silently.
 */
export function readEnv(source: Source): Env {
  const rawPort = source.PORT ?? "3001";
  const port = Number(rawPort);
  // Digits only: Number() also accepts "", "0x10" and "1e3", and 0 would
  // silently bind a random port.
  if (!/^\d+$/.test(rawPort) || port < 1 || port > 65_535) {
    throw new Error(`PORT must be an integer from 1 to 65535, got "${source.PORT}".`);
  }
  const databasePath = source.DATABASE_PATH ?? "./data/ouro.sqlite";
  if (databasePath.trim() === "") {
    throw new Error("DATABASE_PATH must not be empty.");
  }
  return { port, databasePath, vexa: readVexa(source), analysis: readAnalysis(source) };
}

function readVexa(source: Source): Env["vexa"] {
  const apiKey = source.VEXA_API_KEY?.trim();
  if (!apiKey) throw new Error("VEXA_API_KEY must be set (see apps/api/.env.example).");
  const rawUrl = source.VEXA_API_URL?.trim() || "https://api.cloud.vexa.ai";
  let apiUrl: URL;
  try {
    apiUrl = new URL(rawUrl);
  } catch {
    throw new Error(`VEXA_API_URL must be an absolute URL, got "${rawUrl}".`);
  }
  if (apiUrl.protocol !== "https:" && apiUrl.protocol !== "http:") {
    throw new Error(`VEXA_API_URL must be http(s), got "${rawUrl}".`);
  }
  return { apiKey, apiUrl: apiUrl.origin, webhookSecret: source.VEXA_WEBHOOK_SECRET?.trim() ?? "" };
}

function readAnalysis(source: Source): Env["analysis"] {
  const apiKey = source.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;
  const model = source.ANALYSIS_MODEL?.trim() || DEFAULT_ANALYSIS_MODEL;
  return { apiKey, model };
}
