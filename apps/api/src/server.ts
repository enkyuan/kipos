import { createApp } from "./app";
import { openDatabase } from "./database";
import { readEnv } from "./env";
import { createStores } from "./stores";

// Process composition: the one place that reads the environment and opens
// real resources. Everything below it receives them as arguments.
const env = readEnv(Bun.env);
const db = openDatabase(env.databasePath);
const app = createApp(createStores(db)).listen(env.port);

console.info(`api listening on ${app.server?.url.href}`);

async function shutDown(): Promise<void> {
  // Finish in-flight requests before the database they write to closes.
  await app.stop();
  db.close();
  process.exit(0);
}

process.once("SIGINT", shutDown);
process.once("SIGTERM", shutDown);
