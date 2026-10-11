import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import { ANALYSIS_TOOL, SYSTEM_PROMPT } from "./prompt";
import { modelOutputSchema } from "./model-output";

/**
 * Amazon Bedrock: a Bedrock API key (bearer token), the region it belongs
 * to, and the model, usually a cross-region inference profile such as
 * `us.anthropic.claude-sonnet-4-6`.
 */
export type AnalyzerConfig = { apiKey: string; region: string; model: string };

/** Sends one analysis prompt; resolves to the model's raw tool input (unvalidated). */
export type Analyzer = (prompt: string) => Promise<unknown>;

const TIMEOUT_MS = 60_000;

/**
 * Claude on Bedrock (InvokeModel), forced to answer with the
 * `record_analysis` tool so the reply is structured. The tool has no
 * effect: its input is the answer, validated by the caller. No other tool
 * is offered, so nothing said in a meeting can make the model act.
 */
export function createClaudeAnalyzer(config: AnalyzerConfig, send?: typeof fetch): Analyzer {
  // Credentials come only from the config: never the SDK's own reading of
  // AWS_* variables, so server.ts stays the one place that reads them.
  const client = new AnthropicBedrock({
    apiKey: config.apiKey,
    awsRegion: config.region,
    timeout: TIMEOUT_MS,
    ...(send && { fetch: send }),
  });
  return async (prompt) => {
    const response = await client.messages.create({
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
    });
    const call = response.content.find(
      (block) => block.type === "tool_use" && block.name === ANALYSIS_TOOL,
    );
    if (!call || call.type !== "tool_use") {
      throw new Error(`Claude answered without the analysis tool call (${response.stop_reason})`);
    }
    return call.input;
  };
}
