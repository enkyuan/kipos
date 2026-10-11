import { describe, expect, test } from "bun:test";
import type { MeetingSession } from "./contract";
import { createTestApp, segment, startRequest, statusFrame, transcriptFrame } from "./fixtures";
import { createVexaNotetaker, createVexaWatcher } from "./vexa-stream";

type Listener = (event: { data?: unknown }) => void;

function fakeSocket() {
  const listeners = new Map<string, Listener[]>();
  const sent: unknown[] = [];
  return {
    sent,
    socket: {
      send: (data: string) => void sent.push(JSON.parse(data)),
      close: () => listeners.get("close")?.forEach((listener) => listener({})),
      addEventListener: (type: string, listener: Listener) =>
        listeners.set(type, [...(listeners.get(type) ?? []), listener]),
    },
    emit: (type: string, data?: unknown) =>
      listeners
        .get(type)
        ?.forEach((listener) =>
          listener({ data: data === undefined ? undefined : JSON.stringify(data) }),
        ),
  };
}

async function watching(record: unknown = { segments: [], status: "active" }) {
  const context = createTestApp();
  const session = (await (
    await context.app.handle(startRequest("https://meet.google.com/abc-defg-hij"))
  ).json()) as MeetingSession;
  const fake = fakeSocket();
  const connections: string[] = [];
  const watcher = createVexaWatcher({
    config: { apiKey: "key", apiUrl: "https://api.cloud.vexa.ai" },
    client: { readTranscript: async () => record },
    ingestion: { meetings: context.stores.meetings, feed: context.feed },
    sessionOf: (id) => context.stores.meetings.find(id),
    giveUp: () => {},
    connect: (url) => {
      connections.push(url);
      return fake.socket as never;
    },
  });
  watcher.watch(session.id, "abc-defg-hij");
  return { ...context, session, fake, connections, watcher };
}

describe("createVexaWatcher", () => {
  test("subscribes to the meeting on the provider's stream", async () => {
    const { fake, connections, watcher } = await watching();
    fake.emit("open");
    expect(connections).toEqual(["wss://api.cloud.vexa.ai/ws"]);
    expect(fake.sent[0]).toEqual({
      action: "subscribe",
      meetings: [{ platform: "google_meet", native_id: "abc-defg-hij" }],
    });
    watcher.stopAll();
  });

  test("stores confirmed lines from the stream and catches up from the record on subscribe", async () => {
    const { fake, stores, session, watcher } = await watching({
      segments: [segment({ text: "Missed while offline", start: 1 })],
      status: "active",
    });
    fake.emit("open");
    fake.emit("message", { type: "subscribed", meetings: [] });
    fake.emit("message", transcriptFrame([segment({ text: "Live", start: 5 })]));
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(stores.meetings.transcript(session.id).map((u) => u.text)).toEqual([
      "Missed while offline",
      "Live",
    ]);
    watcher.stopAll();
  });

  test("stops following once the meeting ends, and records why it failed", async () => {
    const { fake, stores, session } = await watching({
      segments: [],
      status: "failed",
      completion_reason: "awaiting_admission_rejected",
      end_time: "2026-10-11T10:02:00Z",
    });
    fake.emit("open");
    fake.emit("message", statusFrame("failed", "2026-10-11T10:02:00Z"));
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(stores.meetings.find(session.id)).toMatchObject({
      status: "failed",
      errorMessage: "The host declined to admit the notetaker.",
    });
  });
});

describe("createVexaNotetaker", () => {
  test("follows a bot unless Vexa definitely refused it", async () => {
    const watched: string[] = [];
    const watcher = { watch: (sessionId: string) => void watched.push(sessionId) };
    const answers = [
      { ok: true as const, botId: "1" },
      { ok: false as const, outcome: "unconfirmed" as const, message: "?" },
      { ok: false as const, outcome: "refused" as const, message: "no" },
    ];
    for (const [index, answer] of answers.entries()) {
      const notetaker = createVexaNotetaker({ sendBot: async () => answer }, watcher);
      await notetaker.requestBot({
        meetingUrl: "https://meet.google.com/abc-defg-hij",
        sessionId: `s${index}`,
      });
    }
    expect(watched).toEqual(["s0", "s1"]);
  });
});
