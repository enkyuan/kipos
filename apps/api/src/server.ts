import { createClaudeAnalyzer } from "./analysis/analyzer";
import { createAnalysisScheduler } from "./analysis/scheduler";
import { createApp } from "./app";
import { openDatabase } from "./database";
import { readEnv } from "./env";
import { createLiveFeed } from "./live-feed";
import { drainDeliveries } from "./meetings/ingest";
import { meetingCode } from "./meetings/meeting-url";
import { createVexaClient } from "./meetings/vexa-client";
import { createVexaNotetaker, createVexaWatcher } from "./meetings/vexa-stream";
import { createStores } from "./stores";

// Process composition: the one place that reads the environment and opens
// real resources. Everything below it receives them as arguments.
const env = readEnv(Bun.env);
const db = openDatabase(env.databasePath);
const stores = createStores(db);
const feed = createLiveFeed();
const isFinished = (id: string) => {
  const status = stores.meetings.find(id)?.status;
  return status === undefined || status === "ended" || status === "failed";
};
const analysis = env.analysis
  ? createAnalysisScheduler({
      store: stores.analysisStore,
      transcript: stores.meetings,
      analyze: createClaudeAnalyzer(env.analysis),
      feed,
      isFinished,
    })
  : null;
const ingestion = {
  meetings: stores.meetings,
  feed,
  onMeetingChanged: (id: string) => analysis?.notify(id),
};
const vexa = createVexaClient(env.vexa);
const watcher = createVexaWatcher({
  config: env.vexa,
  client: vexa,
  ingestion,
  sessionOf: (id) => stores.meetings.find(id),
  giveUp: (id) => {
    const message = "Vexa never reported the notetaker joining. Start again to retry.";
    const session = stores.meetings.fail(id, message, new Date().toISOString());
    feed.publish(id, { type: "session", data: session });
  },
});

// Webhook deliveries acknowledged before a restart (and ones that failed)
// are processed now; live sessions are followed again.
drainDeliveries({ ...ingestion, inbox: stores.inbox }, { retryFailed: true });
for (const session of stores.meetings.liveSessions()) {
  watcher.watch(session.id, meetingCode(session.meetingUrl));
  analysis?.notify(session.id);
}

const app = createApp({
  ...stores,
  analysis,
  feed,
  notetaker: createVexaNotetaker(vexa, watcher),
  webhookSecret: env.vexa.webhookSecret,
}).listen(env.port);

console.info(`api listening on ${app.server?.url.href} · Vexa at ${env.vexa.apiUrl}`);
console.info(
  analysis ? `analysis on (${env.analysis?.model})` : "analysis off: set AWS_BEARER_TOKEN_BEDROCK",
);

async function shutDown(): Promise<void> {
  watcher.stopAll();
  analysis?.stopAll();
  // Finish in-flight requests before the database they write to closes.
  await app.stop();
  db.close();
  process.exit(0);
}

process.once("SIGINT", shutDown);
process.once("SIGTERM", shutDown);
