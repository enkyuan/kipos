# 0006 — Requirement analysis on Amazon Bedrock

Status: accepted (2026-10-11). Amends 0004 (provider and configuration).

## Context

0004 called the Anthropic API directly with `ANTHROPIC_API_KEY`. The team's
model access is through Amazon Bedrock: a Bedrock API key in `us-east-1`,
for Claude Sonnet 4.6 through the US cross-region inference profile
`us.anthropic.claude-sonnet-4-6`.

## Decision

- The analyzer (`analysis/analyzer.ts`) uses `AnthropicBedrock` from
  `@anthropic-ai/bedrock-sdk` (pinned exactly), which calls Bedrock's
  InvokeModel. InvokeModel is the path that takes inference profile IDs;
  on-demand base model IDs are refused for this model.
- Configuration: analysis is on exactly when `AWS_BEARER_TOKEN_BEDROCK` (a
  Bedrock API key, sent as a bearer token) is set. `AWS_REGION` defaults to
  `us-east-1`, `ANALYSIS_MODEL` to `us.anthropic.claude-sonnet-4-6`.
  `ANTHROPIC_API_KEY` no longer enables anything in `apps/api`.
- The key and region reach the client from `server.ts`'s configuration
  only; the SDK's own environment lookup is not relied on.
- Everything else in 0004 holds: forced `record_analysis` tool use (Sonnet
  4.6 accepts a forced `tool_choice`), schema validation, code-enforced
  invariants. The SDK retries 429 and 5xx answers twice, each attempt
  bounded at 60 s.

## Consequences

- Changing the model is configuration, but a newer model may reject forced
  tool use (Sonnet 5.5, Opus 5.5 and Fable 5.1 return 400 for it); moving to
  one means switching to `tool_choice: auto` with `strict: true`, or
  structured outputs.
- Server-side refusal fallbacks are not available on Bedrock; a refusal
  (no tool call) fails the cycle, and the scheduler retries the same batch
  with backoff, as for any other failure.
- `apps/dial-service` still calls the Anthropic API with its own
  `ANTHROPIC_API_KEY`; it is a separate app with its own owner.
