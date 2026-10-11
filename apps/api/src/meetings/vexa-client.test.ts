import { describe, expect, test } from "bun:test";
import { createVexaClient } from "./vexa-client";

const config = { apiKey: "secret-key", apiUrl: "https://api.cloud.vexa.ai" };

function recording(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const send = (async (url: URL, init: RequestInit) => {
    calls.push({ url: url.href, init });
    return Response.json(body, { status });
  }) as unknown as typeof fetch;
  return { calls, send };
}

const quietly = <T>(run: () => Promise<T>) => {
  const original = console.error;
  console.error = () => {};
  return run().finally(() => {
    console.error = original;
  });
};

describe("createVexaClient().sendBot", () => {
  test("asks for a passive, named bot that keeps no audio and leaves an emptied call", async () => {
    const { calls, send } = recording(201, { id: 812, status: "requested" });
    expect(await createVexaClient(config, send).sendBot("abc-defg-hij")).toEqual({
      ok: true,
      botId: "812",
    });
    const [call] = calls;
    expect(call!.url).toBe("https://api.cloud.vexa.ai/bots");
    expect(new Headers(call!.init.headers).get("x-api-key")).toBe("secret-key");
    expect(JSON.parse(call!.init.body as string)).toEqual({
      platform: "google_meet",
      native_meeting_id: "abc-defg-hij",
      bot_name: "Ouro notetaker",
      language: "en",
      transcribe_enabled: true,
      recording_enabled: false,
      automatic_leave: { max_time_left_alone: 120_000 },
    });
  });

  test("a definite refusal says why, without echoing the key", async () => {
    const cases: [number, unknown, string][] = [
      [401, { detail: "bad key secret-key" }, "API key"],
      [409, { detail: "exists" }, "already in this meeting"],
      [422, { detail: [{ msg: "native_meeting_id is invalid" }] }, "native_meeting_id is invalid"],
      [503, { detail: "no transcription backend configured" }, "no transcription backend"],
    ];
    for (const [status, body, expected] of cases) {
      const { send } = recording(status, body);
      const answer = await quietly(() => createVexaClient(config, send).sendBot("abc-defg-hij"));
      expect(answer).toMatchObject({ ok: false, outcome: "refused" });
      expect(JSON.stringify(answer)).toContain(expected);
      expect(JSON.stringify(answer)).not.toContain("secret-key");
    }
  });

  test("an unanswered or 5xx request is unconfirmed, not refused", async () => {
    const down = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    for (const send of [down, recording(502, null).send]) {
      const answer = await quietly(() => createVexaClient(config, send).sendBot("abc-defg-hij"));
      expect(answer).toMatchObject({ ok: false, outcome: "unconfirmed" });
    }
  });
});
