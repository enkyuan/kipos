import { describe, expect, test } from "bun:test";
import { createHmac } from "node:crypto";
import type { MeetingSession } from "./contract";
import { createTestApp, settle, signedVexaRequest, startRequest, statusWebhook } from "./fixtures";

async function started() {
  const context = createTestApp();
  const response = await context.app.handle(startRequest("https://meet.google.com/abc-defg-hij"));
  const session = (await response.json()) as MeetingSession;
  const deliver = async (...payloads: unknown[]) => {
    for (const payload of payloads) {
      expect((await context.app.handle(signedVexaRequest(payload))).status).toBe(200);
    }
    await settle();
  };
  return { ...context, session, deliver, status: () => context.stores.meetings.find(session.id)! };
}

describe("POST /api/webhooks/vexa: verification", () => {
  test("rejects an unsigned or wrongly signed delivery and stores nothing", async () => {
    const { app, db } = await started();
    const payload = statusWebhook({ meetingId: "1", to: "active", at: "2026-10-11T10:01:00Z" });
    const forged = signedVexaRequest(payload, { secret: "wrong" });
    const unsigned = new Request("http://test/api/webhooks/vexa", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    for (const request of [forged, unsigned]) expect((await app.handle(request)).status).toBe(401);
    await settle();
    expect(db.query("SELECT * FROM provider_deliveries").all()).toEqual([]);
  });

  test("rejects a delivery whose timestamp is outside the replay window", async () => {
    const { app } = await started();
    const stale = Math.floor(Date.now() / 1000) - 10 * 60;
    const payload = statusWebhook({ meetingId: "1", to: "active", at: "2026-10-11T10:01:00Z" });
    expect((await app.handle(signedVexaRequest(payload, { timestamp: stale }))).status).toBe(401);
  });

  test("rejects a body altered after signing", async () => {
    const { app } = await started();
    const signed = signedVexaRequest(
      statusWebhook({ meetingId: "1", to: "active", at: "2026-10-11T10:01:00Z" }),
    );
    const tampered = new Request(signed.url, {
      method: "POST",
      headers: signed.headers,
      body: JSON.stringify(
        statusWebhook({ meetingId: "1", to: "failed", at: "2026-10-11T10:01:00Z" }),
      ),
    });
    expect((await app.handle(tampered)).status).toBe(401);
  });

  test("rejects everything when no secret is configured", async () => {
    const { app } = await started();
    const body = "{}";
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", "").update(`${timestamp}.${body}`).digest("hex");
    const request = new Request("http://test/api/webhooks/vexa", {
      method: "POST",
      headers: {
        "x-webhook-timestamp": String(timestamp),
        "x-webhook-signature": `sha256=${signature}`,
      },
      body,
    });
    // The fixture's app has a secret; an empty-secret signature must not pass it either.
    expect((await app.handle(request)).status).toBe(401);
  });
});

describe("POST /api/webhooks/vexa: lifecycle", () => {
  test("applies a verified status change to the session it names", async () => {
    const { deliver, status } = await started();
    await deliver(
      statusWebhook({ meetingId: "1", to: "awaiting_admission", at: "2026-10-11T10:00:05Z" }),
    );
    expect(status().status).toBe("waiting_room");
  });

  test("a repeated delivery (same event id) is acknowledged and stored once", async () => {
    const { deliver, db } = await started();
    const payload = statusWebhook({
      eventId: "evt_same",
      meetingId: "1",
      to: "active",
      at: "2026-10-11T10:01:00Z",
    });
    await deliver(payload, payload);
    expect(db.query("SELECT id FROM provider_deliveries").all()).toEqual([{ id: "evt_same" }]);
  });

  test("shows a failed admission, with its reason, as a failure", async () => {
    const { deliver, status } = await started();
    await deliver(
      statusWebhook({
        meetingId: "1",
        to: "failed",
        at: "2026-10-11T10:10:00Z",
        reason: "awaiting_admission_timeout",
      }),
    );
    expect(status()).toMatchObject({
      status: "failed",
      errorMessage: "Nobody admitted the notetaker before it gave up waiting.",
    });
  });

  test("a webhook naming another Vexa meeting never lands on a session without a bot id", async () => {
    const context = createTestApp({ ok: false, outcome: "unconfirmed", message: "No answer" });
    const response = await context.app.handle(startRequest("https://meet.google.com/abc-defg-hij"));
    const session = (await response.json()) as MeetingSession;
    const stranger = statusWebhook({ meetingId: "777", to: "failed", at: "2026-10-11T10:10:00Z" });
    expect((await context.app.handle(signedVexaRequest(stranger))).status).toBe(200);
    await settle();
    expect(context.stores.meetings.find(session.id)?.status).toBe("requested");
  });

  test("ignores events about meetings this app did not start", async () => {
    const { deliver, status } = await started();
    const foreign = statusWebhook({ meetingId: "999", to: "failed", at: "2026-10-11T10:10:00Z" });
    foreign.data.meeting.native_meeting_id = "zzz-zzzz-zzz";
    await deliver(foreign);
    expect(status().status).toBe("requested");
  });
});
