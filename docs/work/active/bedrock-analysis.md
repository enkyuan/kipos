# Requirement analysis through Amazon Bedrock

State: REVIEW
Branch: feat/meeting-ingestion
Worktree: primary checkout
Base SHA: 70bf5ed
Head SHA: see branch
Depends on: requirement-analysis (same branch)

## Goal

The analysis model runs on Amazon Bedrock through the
`us.anthropic.claude-sonnet-4-6` cross-region inference profile in
`us-east-1`, authenticated with a Bedrock API key, instead of the Anthropic
API with `ANTHROPIC_API_KEY`.

## Scope

Expected paths: `apps/api/src/analysis/analyzer{,.test}.ts`,
`apps/api/src/env{,.test}.ts`, `apps/api/src/server.ts` (startup log),
`apps/api/.env.example`, `apps/api/package.json` + `bun.lock` (SDK),
`apps/web/src/features/analysis/analysis-panel.tsx` (the "analysis is off"
copy), `README.md`, `docs/testing.md`, `docs/decisions/`.
Shared/high-contention paths: `apps/api/package.json`, `bun.lock`.
Must not modify: `apps/dial-service` (separate app and owner; it still
calls the Anthropic API with `ANTHROPIC_API_KEY`).

## Acceptance

- Analysis is on exactly when `AWS_BEARER_TOKEN_BEDROCK` is set; region from
  `AWS_REGION` (default `us-east-1`), model from `ANALYSIS_MODEL` (default
  `us.anthropic.claude-sonnet-4-6`).
- The analyzer sends one forced `record_analysis` tool call to Bedrock's
  InvokeModel for the inference profile, with the key as a bearer token,
  and fails loudly on a non-tool answer or an error status.
- No `ANTHROPIC_API_KEY` path remains in `apps/api`.
- `bun run verify` passes.

## Decisions

Recorded in `docs/decisions/0006-analysis-on-bedrock.md`: `AnthropicBedrock`
(InvokeModel, which takes inference profiles) from
`@anthropic-ai/bedrock-sdk@0.33.8`, pinned to the newest release over two
weeks old; the key and region passed explicitly from `server.ts`'s config;
no `ANTHROPIC_API_KEY` fallback (deleted, not kept for compatibility).

## Verification

- [x] targeted tests: `analyzer.test.ts` (InvokeModel URL for the
      inference profile in us-east-1, `Authorization: Bearer <key>`,
      `anthropic_version: bedrock-2023-05-31`, forced tool; a text answer
      and a 403 both fail loudly), `env.test.ts` (defaults, overrides, and
      `ANTHROPIC_API_KEY` alone leaves analysis off)
- [x] bun run verify (api 84, ui 2, web build 5, structure 6, claude-plugin
      8, dial-service 20)
- [ ] live call: needs `AWS_BEARER_TOKEN_BEDROCK` in `apps/api/.env`
      (placeholder added, empty), then restart `bun run dev` and watch the
      startup line say `analysis on (us.anthropic.claude-sonnet-4-6)`.

## Remaining

Live call with the person's key; adversarial review.
