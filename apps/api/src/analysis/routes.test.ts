import { describe, expect, test } from "bun:test";
import { createApp } from "../app";
import { openDatabase } from "../database";
import { createLiveFeed } from "../live-feed";
import { createStores } from "../stores";
import type { CandidateIssue } from "./contract";

function setup() {
  const db = openDatabase(":memory:");
  const stores = createStores(db);
  const feed = createLiveFeed();
  const app = createApp({
    ...stores,
    analysis: {
      notify: () => {},
      stateOf: () => ({ enabled: true, state: "idle", analyzedAt: null }),
    },
    feed,
    notetaker: { requestBot: async () => ({ ok: true, botId: "1" }) },
    webhookSecret: "s",
  });
  const { session } = stores.meetings.start(
    "https://meet.google.com/abc-defg-hij",
    new Date().toISOString(),
  );
  const said = stores.meetings.recordUtterance(
    session.id,
    {
      dedupKey: "k1",
      speakerId: "Ada",
      speakerName: "Ada",
      text: "Large refunds need approval.",
      startTime: 1,
      endTime: 3,
    },
    new Date().toISOString(),
  )!;
  const now = new Date().toISOString();
  stores.analysisStore.commit(session.id, {
    requirements: [],
    issues: [
      {
        id: "issue-1",
        meetingSessionId: session.id,
        type: "missing_business_rule",
        summary: "Refund approval threshold not specified",
        implementationImpact: "The approval rule needs its amount.",
        suggestedQuestion: "Above what amount does a refund need approval?",
        suggestedOwner: null,
        evidenceUtteranceIds: [said.id],
        resolutionUtteranceIds: [],
        priority: "high",
        status: "open",
        dismissedAtUtteranceId: null,
        savedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    cursor: said.id,
    at: now,
  });
  const post = (path: string) =>
    app.handle(new Request(`http://test/api/meetings/${session.id}${path}`, { method: "POST" }));
  return { app, stores, session, said, post };
}

describe("analysis routes", () => {
  test("returns the persisted analysis, without server-side fields", async () => {
    const { app, session } = setup();
    const response = await app.handle(
      new Request(`http://test/api/meetings/${session.id}/analysis`),
    );
    const body = (await response.json()) as { issues: CandidateIssue[] };
    expect(body.issues).toHaveLength(1);
    expect(body.issues[0]).not.toHaveProperty("dismissedAtUtteranceId");
  });

  test("dismissing remembers the newest utterance, so only later evidence can revive it", async () => {
    const { post, stores, session, said } = setup();
    const response = await post("/issues/issue-1/dismiss");
    expect(((await response.json()) as CandidateIssue).status).toBe("dismissed");
    expect(stores.analysisStore.issues(session.id)[0]!.dismissedAtUtteranceId).toBe(said.id);
  });

  test("saving the suggested question keeps the issue open and records when", async () => {
    const { post } = setup();
    const saved = (await (await post("/issues/issue-1/save")).json()) as CandidateIssue;
    expect(saved.status).toBe("open");
    expect(saved.savedAt).not.toBeNull();
  });

  test("answers an unknown meeting or issue with 404", async () => {
    const { app, post } = setup();
    expect((await app.handle(new Request("http://test/api/meetings/nope/analysis"))).status).toBe(
      404,
    );
    expect((await post("/issues/nope/dismiss")).status).toBe(404);
  });
});
