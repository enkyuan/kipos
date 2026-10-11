# Claude Code integration (Superpower plugin + Dial service)

State: REVIEW
Branch: feat/claude-code-integration
Worktree: ../ouro-wt/feat-claude-code-integration
Base SHA: 52e8cc3
Head SHA: (see branch)
Depends on: none

## Goal

Claude Code, while building for a client, can read the client's business context and ask a real employee (Dial phone call or SMS) when a business rule is missing, then implement the answer.

## Scope

Expected paths: apps/claude-plugin/, apps/dial-service/, docs/architecture.md, this record.
Shared/high-contention paths: bun.lock, knip.jsonc, .gitignore, .prettierignore.
Must not modify: apps/api, apps/web, packages/.

## Acceptance

- `bun run verify` passes.
- A real clarification call placed through the plugin reaches the stakeholder and its transcript returns through `check_clarification` (done 2026-10-11 against production).
- Requests without the token get 401; another engagement's clarification gets 404.

## Decisions

- No database: Dial's call/message history is the record (metadata in the call instruction; `Ref SP-` codes in texts).
- Phone numbers only in server-side `STAKEHOLDERS_JSON`; the plugin addresses people by id.
- `completed`/`replied`, not `answered`: the service can't tell whether the person answered, so Claude must read the transcript.
- The plugin bundle (`apps/claude-plugin/dist/`) is committed because Claude Code installs plugins by copying the folder; the bundle carries an `oxlint-disable` banner.
- `/knowledge` is a mock until the team knowledge backend serves the same shape (plugin option `knowledge_url`).

## Known limitations

- SMS is rejected by US carriers until the Dial number is 10DLC-registered.
- No structured answer extraction unless `ANTHROPIC_API_KEY` is set on the service.
