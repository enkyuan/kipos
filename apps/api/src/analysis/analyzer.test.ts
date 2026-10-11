import { expect, test } from "bun:test";
import { createClaudeAnalyzer } from "./analyzer";

const config = {
  apiKey: "bedrock-test-key",
  region: "us-east-1",
  model: "us.anthropic.claude-sonnet-4-6",
};

const answering = (status: number, body: unknown) =>
  (async () => Response.json(body, { status })) as unknown as typeof fetch;

test("forces a single structured tool answer from the inference profile on Bedrock", async () => {
  let request: { url: string; init: RequestInit } | undefined;
  const send = (async (url: string | URL, init: RequestInit) => {
    request = { url: String(url), init };
    return Response.json({
      content: [
        {
          type: "tool_use",
          id: "t",
          name: "record_analysis",
          input: { requirements: [], issues: [] },
        },
      ],
      stop_reason: "tool_use",
    });
  }) as unknown as typeof fetch;

  const answer = await createClaudeAnalyzer(config, send)("prompt");

  expect(answer).toEqual({ requirements: [], issues: [] });
  expect(request!.url).toBe(
    "https://bedrock-runtime.us-east-1.amazonaws.com/model/us.anthropic.claude-sonnet-4-6/invoke",
  );
  expect(new Headers(request!.init.headers).get("authorization")).toBe("Bearer bedrock-test-key");
  const body = JSON.parse(request!.init.body as string);
  expect(body.anthropic_version).toBe("bedrock-2023-05-31");
  expect(body.tool_choice).toEqual({ type: "tool", name: "record_analysis" });
  expect(body.tools.map((tool: { name: string }) => tool.name)).toEqual(["record_analysis"]);
  expect(body.messages).toEqual([{ role: "user", content: "prompt" }]);
});

test("fails loudly when the model does not answer with the tool, or Bedrock refuses", async () => {
  const chatty = answering(200, {
    content: [{ type: "text", text: "hi" }],
    stop_reason: "end_turn",
  });
  await expect(createClaudeAnalyzer(config, chatty)("p")).rejects.toThrow(
    /without the analysis tool/,
  );
  // A 4xx is not retried: the request itself is wrong (bad key, no model access).
  const denied = answering(403, { message: "not authorized for this model" });
  await expect(createClaudeAnalyzer(config, denied)("p")).rejects.toThrow(/403/);
});
