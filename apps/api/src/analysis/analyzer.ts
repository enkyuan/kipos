import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import type { BedrockAuth } from "../env";
import { ANALYSIS_TOOL, SYSTEM_PROMPT } from "./prompt";
import { modelOutputSchema } from "./model-output";

/**
 * Amazon Bedrock: credentials, the region they belong to, and the model,
 * usually a cross-region inference profile such as
 * `us.anthropic.claude-sonnet-4-6`.
 */
export type AnalyzerConfig = { auth: BedrockAuth; region: string; model: string };

/** Sends one analysis prompt; resolves to the model's raw tool input (unvalidated). */
export type Analyzer = (prompt: string) => Promise<unknown>;

const TIMEOUT_MS = 60_000;

/**
 * Credentials come only from the config, never from the SDK's own reading
 * of AWS_* variables, so server.ts stays the one place that reads them.
 */
function bedrockClient({ auth, region }: AnalyzerConfig, send?: typeof fetch) {
  const options = { awsRegion: region, timeout: TIMEOUT_MS, ...(send && { fetch: send }) };
  if ("apiKey" in auth) return new AnthropicBedrock({ ...options, apiKey: auth.apiKey });
  return new AnthropicBedrock({
    ...options,
    awsAccessKey: auth.accessKeyId,
    awsSecretKey: auth.secretAccessKey,
    awsSessionToken: auth.sessionToken,
  });
}

/**
 * Claude on Bedrock (InvokeModel), forced to answer with the
 * `record_analysis` tool so the reply is structured. The tool has no
 * effect: its input is the answer, validated by the caller. No other tool
 * is offered, so nothing said in a meeting can make the model act.
 */
export function createClaudeAnalyzer(config: AnalyzerConfig, send?: typeof fetch): Analyzer {
  const client = bedrockClient(config, send);
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
