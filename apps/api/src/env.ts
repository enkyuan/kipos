/** Process configuration, read once at startup by `server.ts`. */
export type Env = {
  port: number;
};

type Source = Record<string, string | undefined>;

/**
 * Parses configuration from environment variables. The port has a
 * development default. Anything present but invalid fails startup rather
 * than falling back silently.
 */
export function readEnv(source: Source): Env {
  const rawPort = source.PORT ?? "3001";
  const port = Number(rawPort);
  // Digits only: Number() also accepts "", "0x10" and "1e3", and 0 would
  // silently bind a random port.
  if (!/^\d+$/.test(rawPort) || port < 1 || port > 65_535) {
    throw new Error(`PORT must be an integer from 1 to 65535, got "${source.PORT}".`);
  }
  return { port };
}
