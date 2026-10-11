import { ANALYSIS_TOOL, SYSTEM_PROMPT } from "./prompt";
import { modelOutputSchema } from "./model-output";

export type AnalyzerConfig = { apiKey: string; model: string };

/** Sends one analysis prompt; resolves to the model's raw tool input (unvalidated). */
export type Analyzer = (prompt: string) => Promise<unknown>;

const TIMEOUT_MS = 60_000;

/**
 * Claude through the Messages API, forced to answer with the
 * `record_analysis` tool so the reply is structured. The tool has no
 * effect: its input is the answer, validated by the caller. No other tool
 * is offered, so nothing said in a meeting can make the model act.
 */
export function createClaudeAnalyzer(config: AnalyzerConfig, send: typeof fetch = fetch): Analyzer {
  return async (prompt) => {
    const response = await send("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
        tools: [
          {
            name: ANALYSIS_TOOL,
            description:
              "Record the requirements and issues that the new utterances create or change.",
            input_schema: modelOutputSchema,
          },
        ],
        tool_choice: { type: "tool", name: ANALYSIS_TOOL },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(
        `Claude answered ${response.status}: ${(await response.text()).slice(0, 300)}`,
      );
    }
    const body = (await response.json()) as {
      content?: { type: string; name?: string; input?: unknown }[];
    };
    const call = body.content?.find(
      (block) => block.type === "tool_use" && block.name === ANALYSIS_TOOL,
    );
    if (!call) throw new Error("Claude answered without the analysis tool call");
    return call.input;
  };
}
