import { describe, expect, test } from "bun:test";
import type { ApiError } from "../errors";
import type { MeetingSession, TranscriptUtterance } from "./contract";
import { createTestApp, segment, startRequest, statusFrame, transcriptFrame } from "./fixtures";

const MEET = "https://meet.google.com/abc-defg-hij";

const start = async (context: ReturnType<typeof createTestApp>, link = MEET) =>
  (await (await context.app.handle(startRequest(link))).json()) as MeetingSession;

describe("POST /api/meetings", () => {
  test("creates a session and sends exactly one notetaker", async () => {
    const { app, requests } = createTestApp();
    const response = await app.handle(startRequest(`${MEET}?authuser=1`));
    expect(response.status).toBe(201);
    const session = (await response.json()) as MeetingSession;
    expect(session).toMatchObject({
      meetingUrl: MEET,
      providerBotId: "1",
      status: "requested",
      endedAt: null,
      errorMessage: null,
    });
    expect(requests).toEqual([{ meetingUrl: MEET, sessionId: session.id }]);
  });

  test("a repeated start returns the live session instead of sending another bot", async () => {
    const context = createTestApp();
    const first = await start(context);
    const again = await context.app.handle(startRequest("meet.google.com/ABC-DEFG-HIJ"));
    expect(again.status).toBe(200);
    expect(((await again.json()) as MeetingSession).id).toBe(first.id);
    expect(context.requests).toHaveLength(1);
  });

  test("refuses to start without explicit authorization, and sends no bot", async () => {
    const { app, requests, db } = createTestApp();
    const response = await app.handle(startRequest(MEET, false));
    expect(response.status).toBe(422);
    expect(((await response.json()) as ApiError).error.code).toBe("authorization_required");
    expect(requests).toEqual([]);
    expect(db.query("SELECT * FROM meeting_sessions").all()).toEqual([]);
  });

  test("rejects a link that is not a Google Meet meeting, and sends no bot", async () => {
    const { app, requests } = createTestApp();
    for (const link of [
      "https://zoom.us/j/123",
      "https://meet.google.com/",
      "meet.google.com/abc",
    ]) {
      const response = await app.handle(startRequest(link));
      expect(response.status).toBe(422);
      expect(((await response.json()) as ApiError).error.message).toContain("Google Meet link");
    }
    expect(requests).toEqual([]);
  });
});

describe("POST /api/meetings: when the provider does not confirm", () => {
  test("records a definite refusal as a failed session that frees the meeting", async () => {
    const context = createTestApp({ ok: false, outcome: "refused", message: "Vexa said no" });
    const session = await start(context);
    expect(session).toMatchObject({ status: "failed", errorMessage: "Vexa said no" });
    expect(session.endedAt).not.toBeNull();
    expect((await context.app.handle(startRequest(MEET))).status).toBe(201);
    expect(context.requests).toHaveLength(2);
  });

  test("keeps an unconfirmed request live, so a retry cannot send a second bot", async () => {
    const context = createTestApp({ ok: false, outcome: "unconfirmed", message: "No answer yet" });
    const session = await start(context);
    expect(session).toMatchObject({ status: "requested", errorMessage: "No answer yet" });
    expect((await context.app.handle(startRequest(MEET))).status).toBe(200);
    expect(context.requests).toHaveLength(1);

    // The bot turned up after all: its reports settle the session.
    context.stream(session.id, statusFrame("joining", "2026-10-11T10:00:00Z"));
    expect(context.stores.meetings.find(session.id)).toMatchObject({
      status: "joining",
      errorMessage: null,
    });
  });

  test("replaces a live session that never heard from the provider", async () => {
    const context = createTestApp({ ok: false, outcome: "unconfirmed", message: "No answer" });
    const stale = await start(context);
    context.db.run("UPDATE meeting_sessions SET started_at = ? WHERE id = ?", [
      new Date(Date.now() - 3 * 60_000).toISOString(),
      stale.id,
    ]);
    const fresh = await context.app.handle(startRequest(MEET));
    expect(fresh.status).toBe(201);
    expect(context.stores.meetings.find(stale.id)?.status).toBe("failed");
    expect(context.requests).toHaveLength(2);
  });

  test("does not replace a live session that is still reporting", async () => {
    const context = createTestApp();
    const session = await start(context);
    context.db.run("UPDATE meeting_sessions SET started_at = ? WHERE id = ?", [
      new Date(Date.now() - 60 * 60_000).toISOString(),
      session.id,
    ]);
    context.stream(session.id, statusFrame("active", new Date().toISOString()));
    expect((await context.app.handle(startRequest(MEET))).status).toBe(200);
  });
});

describe("GET /api/meetings/:id and /transcript", () => {
  test("answers an unknown session with 404", async () => {
    const { app } = createTestApp();
    for (const path of [
      "/api/meetings/nope",
      "/api/meetings/nope/transcript",
      "/api/meetings/nope/events",
    ]) {
      expect((await app.handle(new Request(`http://test${path}`))).status).toBe(404);
    }
  });

  test("returns the persisted state on every read (a page refresh)", async () => {
    const context = createTestApp();
    const session = await start(context);
    context.stream(session.id, transcriptFrame([segment({ text: "Hello", start: 1 })]));

    const read = await context.app.handle(new Request(`http://test/api/meetings/${session.id}`));
    expect(((await read.json()) as MeetingSession).id).toBe(session.id);
    const transcript = await context.app.handle(
      new Request(`http://test/api/meetings/${session.id}/transcript`),
    );
    expect(((await transcript.json()) as TranscriptUtterance[]).map((u) => u.text)).toEqual([
      "Hello",
    ]);
  });
});

describe("GET /api/meetings/:id/events", () => {
  test("streams the persisted state first, then new utterances as they are ingested", async () => {
    const context = createTestApp();
    const session = await start(context);
    context.stream(session.id, transcriptFrame([segment({ text: "First", start: 1 })]));

    const controller = new AbortController();
    const response = await context.app.handle(
      new Request(`http://test/api/meetings/${session.id}/events`, { signal: controller.signal }),
    );
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let received = "";
    const readUntil = async (marker: string) => {
      while (!received.includes(marker)) received += decoder.decode((await reader.read()).value);
    };

    await readUntil('"text":"First"');
    expect(received).toContain("event: session");
    expect(received).toContain(`"id":"${session.id}"`);

    context.stream(
      session.id,
      transcriptFrame([segment({ text: "Second", start: 3, speaker: "Grace" })]),
    );
    await readUntil('"text":"Second"');
    expect(received).toContain("event: utterance");
    expect(received).toContain('"speakerName":"Grace"');

    await reader.cancel();
    controller.abort();
  });
});
