/**
 * How the API signs in to Amazon Bedrock: a Bedrock API key (sent as a
 * bearer token), or an IAM access key pair (requests are SigV4-signed),
 * with a session token when the pair is temporary.
 */
export type BedrockAuth =
  | { apiKey: string }
  | { accessKeyId: string; secretAccessKey: string; sessionToken: string | null };

/** Process configuration, read once at startup by `server.ts`. */
export type Env = {
  port: number;
  databasePath: string;
  vexa: { apiKey: string; apiUrl: string; webhookSecret: string };
  /** Null without Bedrock credentials: transcripts still work, analysis is off. */
  analysis: { auth: BedrockAuth; region: string; model: string } | null;
};

type Source = Record<string, string | undefined>;

// Claude Sonnet 4.6 through the US cross-region inference profile on Amazon
// Bedrock (docs/decisions/0006-analysis-on-bedrock.md).
const DEFAULT_ANALYSIS_MODEL = "us.anthropic.claude-sonnet-4-6";
const DEFAULT_AWS_REGION = "us-east-1";

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

const present = (value: string | undefined) => value?.trim() || null;

/** A Bedrock API key wins over an access key pair; half a pair fails startup. */
function readBedrockAuth(source: Source): BedrockAuth | null {
  const apiKey = present(source.AWS_BEARER_TOKEN_BEDROCK);
  if (apiKey) return { apiKey };
  const accessKeyId = present(source.AWS_ACCESS_KEY_ID);
  const secretAccessKey = present(source.AWS_SECRET_ACCESS_KEY);
  if (!accessKeyId && !secretAccessKey) return null;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Set both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, or neither.");
  }
  return { accessKeyId, secretAccessKey, sessionToken: present(source.AWS_SESSION_TOKEN) };
}

function readAnalysis(source: Source): Env["analysis"] {
  const auth = readBedrockAuth(source);
  if (!auth) return null;
  const region = present(source.AWS_REGION) ?? DEFAULT_AWS_REGION;
  const model = present(source.ANALYSIS_MODEL) ?? DEFAULT_ANALYSIS_MODEL;
  return { auth, region, model };
}
