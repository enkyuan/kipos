import { describe, expect, test } from "bun:test";
import type { MeetingSession } from "./contract";
import { drainDeliveries, ingestEvents } from "./ingest";
import { readTranscriptRecord } from "./vexa-events";
import {
  createTestApp,
  segment,
  startRequest,
  statusFrame,
  statusWebhook,
  transcriptFrame,
} from "./fixtures";

async function started() {
  const context = createTestApp();
  const response = await context.app.handle(startRequest("https://meet.google.com/abc-defg-hij"));
  const session = (await response.json()) as MeetingSession;
  const texts = () => context.stores.meetings.transcript(session.id).map((u) => u.text);
  const status = () => context.stores.meetings.find(session.id)!;
  return { ...context, session, texts, status };
}

describe("transcript ingestion", () => {
  test("stores confirmed segments with speaker attribution, never drafts", async () => {
    const { stream, session, stores } = await started();
    stream(
      session.id,
      transcriptFrame(
        [segment({ text: "We ship Friday.", start: 1.2, end: 2.6, speaker: "Ada" })],
        [{ ...segment({ text: "and the", start: 3 }), completed: false }],
      ),
      {
        type: "transcript.mutable",
        payload: { segments: [{ ...segment({ text: "hel", start: 5 }), completed: false }] },
      },
    );
    expect(stores.meetings.transcript(session.id)).toEqual([
      expect.objectContaining({
        speakerName: "Ada",
        text: "We ship Friday.",
        startTime: 1.2,
        endTime: 2.6,
      }),
    ]);
  });

  test("publishes each speaker's words in progress live, without storing them", async () => {
    const { stream, session, stores, feed } = await started();
    const published: { type: string; data: unknown }[] = [];
    feed.subscribe(session.id, (event) => published.push(event));
    stream(
      session.id,
      transcriptFrame(
        [segment({ text: "We ship Friday.", start: 1 })],
        [
          { ...segment({ text: "and the", start: 3 }), completed: false },
          { ...segment({ text: "invoices", start: 4 }), completed: false },
        ],
      ),
      // The bundle's speaker has nothing pending: their draft is cleared.
      transcriptFrame([]),
    );
    expect(published.map(({ type }) => type)).toEqual(["utterance", "draft", "draft"]);
    expect(published.slice(1).map(({ data }) => data)).toEqual([
      { speakerName: "Ada", text: "and the invoices" },
      { speakerName: "Ada", text: "" },
    ]);
    expect(stores.meetings.transcript(session.id).map((u) => u.text)).toEqual(["We ship Friday."]);
  });

  test("a segment delivered again, by any path, is stored once", async () => {
    const { stream, session, texts } = await started();
    const once = segment({ text: "Once", start: 4, id: "sess:1:4000" });
    stream(session.id, transcriptFrame([once]), transcriptFrame([once]), {
      type: "transcript.finalized",
      payload: { segments: [once] },
    });
    expect(texts()).toEqual(["Once"]);
  });

  test("returns utterances in spoken order when they arrive out of order", async () => {
    const { stream, session, texts } = await started();
    stream(
      session.id,
      transcriptFrame([segment({ text: "third", start: 9 })]),
      transcriptFrame([segment({ text: "first", start: 1, speaker: "Grace" })]),
      transcriptFrame([segment({ text: "second", start: 5 })]),
    );
    expect(texts()).toEqual(["first", "second", "third"]);
  });

  test("keeps an unattributed segment with an unknown speaker", async () => {
    const { stream, session, stores } = await started();
    stream(session.id, transcriptFrame([segment({ text: "Who", start: 1, speaker: "" })]));
    expect(stores.meetings.transcript(session.id)).toEqual([
      expect.objectContaining({ speakerId: null, speakerName: null, text: "Who" }),
    ]);
  });
});

describe("transcript times", () => {
  test("times epoch-stamped segments from the session's start, on every path", async () => {
    const { stream, session, stores, feed } = await started();
    const at = (offset: number) => Date.parse(session.startedAt) / 1000 + offset;
    const later = segment({ text: "Then this.", start: at(42.5), end: at(44), id: "ch-0:2" });
    const earlier = segment({ text: "First this.", start: at(3.25), end: at(5), id: "ch-0:1" });
    stream(session.id, transcriptFrame([later]));
    const record = { start_time: session.startedAt, segments: [earlier, later] };
    const reading = { receivedAt: new Date().toISOString(), startedAt: session.startedAt };
    ingestEvents(
      { meetings: stores.meetings, feed },
      session.id,
      readTranscriptRecord(record, reading),
    );
    expect(
      stores.meetings.transcript(session.id).map(({ text, startTime, endTime }) => ({
        text,
        startTime,
        endTime,
      })),
    ).toEqual([
      { text: "First this.", startTime: 3.25, endTime: 5 },
      { text: "Then this.", startTime: 42.5, endTime: 44 },
    ]);
  });
});

describe("lifecycle", () => {
  test("follows the provider from waiting room to listening to ended", async () => {
    const { stream, session, status } = await started();
    stream(session.id, statusFrame("joining", "2026-10-11T10:00:00Z"));
    expect(status().status).toBe("joining");
    stream(session.id, statusFrame("awaiting_admission", "2026-10-11T10:00:05Z"));
    expect(status().status).toBe("waiting_room");
    stream(session.id, statusFrame("active", "2026-10-11T10:01:00Z"));
    expect(status().status).toBe("recording");
    stream(session.id, statusFrame("stopping", "2026-10-11T10:29:58Z"));
    expect(status().status).toBe("recording");
    stream(session.id, statusFrame("completed", "2026-10-11T10:30:00Z"));
    expect(status()).toMatchObject({
      status: "ended",
      endedAt: "2026-10-11T10:30:00Z",
      errorMessage: null,
    });
  });

  test("reaches the same status whatever order the reports arrive in", async () => {
    const reports = [
      statusFrame("joining", "2026-10-11T10:00:00Z"),
      statusFrame("awaiting_admission", "2026-10-11T10:00:05Z"),
      statusFrame("active", "2026-10-11T10:01:00Z"),
      statusFrame("completed", "2026-10-11T10:30:00Z"),
    ];
    for (const order of [
      reports,
      [...reports].reverse(),
      [reports[2], reports[3], reports[0], reports[1]],
    ]) {
      const { stream, session, status } = await started();
      stream(session.id, ...order);
      expect(status()).toMatchObject({ status: "ended", endedAt: "2026-10-11T10:30:00Z" });
    }
  });

  test("an older live report arriving late does not overwrite a newer one", async () => {
    const { stream, session, status } = await started();
    stream(
      session.id,
      statusFrame("active", "2026-10-11T10:01:00Z"),
      statusFrame("awaiting_admission", "2026-10-11T10:00:05Z"),
    );
    expect(status().status).toBe("recording");
  });

  test("shows a refused admission as a failure with the reason", async () => {
    const { stream, session, status } = await started();
    stream(session.id, statusFrame("awaiting_admission", "2026-10-11T10:00:05Z"), {
      type: "meeting.status",
      payload: { status: "failed", completion_reason: "awaiting_admission_rejected" },
      ts: "2026-10-11T10:02:00Z",
    });
    expect(status()).toMatchObject({
      status: "failed",
      errorMessage: "The host declined to admit the notetaker.",
    });
  });
});

describe("local failures", () => {
  test("a session failed here stays failed whatever its bot reports later", async () => {
    const { stream, session, status, stores } = await started();
    stores.meetings.fail(session.id, "Replaced.", new Date().toISOString());
    stream(
      session.id,
      statusFrame("joining", "2026-10-11T10:00:00Z"),
      statusFrame("active", "2026-10-11T10:01:00Z"),
    );
    expect(status()).toMatchObject({ status: "failed", errorMessage: "Replaced." });
  });
});

describe("catch-up reads", () => {
  test("ignore the record of an earlier meeting on the same Meet code", () => {
    const earlier = {
      start_time: "2026-10-04T10:00:00Z",
      status: "completed",
      end_time: "2026-10-04T10:30:00Z",
      segments: [segment({ text: "Last week", start: 1 })],
    };
    const options = { receivedAt: "2026-10-11T10:05:00Z", startedAt: "2026-10-11T10:00:00Z" };
    expect(readTranscriptRecord(earlier, options)).toEqual([]);
    expect(
      readTranscriptRecord({ ...earlier, start_time: "2026-10-11T10:00:30Z" }, options),
    ).toHaveLength(2);
  });
});

describe("drainDeliveries", () => {
  test("processes webhook deliveries acknowledged before a restart", async () => {
    const { db, stores, feed, session, status } = await started();
    stores.inbox.accept(
      "evt_1",
      JSON.stringify(statusWebhook({ meetingId: "1", to: "active", at: "2026-10-11T10:01:00Z" })),
      "t",
    );
    drainDeliveries({ meetings: stores.meetings, feed, inbox: stores.inbox });
    expect(status().status).toBe("recording");
    expect(db.query("SELECT payload FROM provider_deliveries").all()).toEqual([{ payload: null }]);
    expect(session.id).toBeTruthy();
  });

  test("records an unreadable delivery, moves on, and retries it at startup", async () => {
    const { db, stores, feed } = await started();
    const original = console.error;
    console.error = () => {};
    stores.inbox.accept("evt_bad", "{not json", "t");
    drainDeliveries({ meetings: stores.meetings, feed, inbox: stores.inbox });
    const failed = db
      .query<{ payload: string; error: string }, []>(
        "SELECT payload, error FROM provider_deliveries",
      )
      .get();
    expect(failed?.payload).toBe("{not json");
    expect(failed?.error).toBeTruthy();
    expect(stores.inbox.pending()).toEqual([]);
    expect(stores.inbox.pending(true)).toHaveLength(1);
    console.error = original;
  });
});
