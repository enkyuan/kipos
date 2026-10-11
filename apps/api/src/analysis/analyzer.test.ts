import { expect, test } from "bun:test";
import { createClaudeAnalyzer } from "./analyzer";

test("forces a single structured tool answer from the configured model", async () => {
  let request: { url: string; init: RequestInit } | undefined;
  const send = (async (url: string, init: RequestInit) => {
    request = { url, init };
    return Response.json({
      content: [
        { type: "tool_use", name: "record_analysis", input: { requirements: [], issues: [] } },
      ],
    });
  }) as unknown as typeof fetch;

  const answer = await createClaudeAnalyzer(
    { apiKey: "sk-test", model: "claude-sonnet-5-5" },
    send,
  )("prompt");

  expect(answer).toEqual({ requirements: [], issues: [] });
  expect(request!.url).toBe("https://api.anthropic.com/v1/messages");
  expect(new Headers(request!.init.headers).get("x-api-key")).toBe("sk-test");
  const body = JSON.parse(request!.init.body as string);
  expect(body.model).toBe("claude-sonnet-5-5");
  expect(body.tool_choice).toEqual({ type: "tool", name: "record_analysis" });
  expect(body.tools.map((tool: { name: string }) => tool.name)).toEqual(["record_analysis"]);
  expect(body.messages).toEqual([{ role: "user", content: "prompt" }]);
});

test("fails loudly when the model does not answer with the tool", async () => {
  const send = (async () =>
    Response.json({ content: [{ type: "text", text: "hi" }] })) as unknown as typeof fetch;
  expect(createClaudeAnalyzer({ apiKey: "k", model: "m" }, send)("p")).rejects.toThrow(
    /without the analysis tool/,
  );
  const down = (async () => new Response("overloaded", { status: 529 })) as unknown as typeof fetch;
  expect(createClaudeAnalyzer({ apiKey: "k", model: "m" }, down)("p")).rejects.toThrow(/529/);
});
