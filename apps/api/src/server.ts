import { createApp } from "./app";
import { readEnv } from "./env";

// Process composition: the one place that reads the environment and opens
// real resources (none yet). Everything below it receives them as arguments.
const env = readEnv(Bun.env);

const app = createApp().listen(env.port);

console.info(`api listening on ${app.server?.url.href}`);

async function shutDown(): Promise<void> {
  // Finish in-flight requests before the process exits.
  await app.stop();
  process.exit(0);
}

process.once("SIGINT", shutDown);
process.once("SIGTERM", shutDown);
