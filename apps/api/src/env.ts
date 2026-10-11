/** Process configuration, read once at startup by `server.ts`. */
export type Env = {
  port: number;
  databasePath: string;
};

/**
 * Parses configuration from environment variables. Development defaults keep
 * `bun dev` zero-config; a value that is present but invalid fails startup
 * rather than falling back silently.
 */
export function readEnv(source: Record<string, string | undefined>): Env {
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
  return { port, databasePath };
}
