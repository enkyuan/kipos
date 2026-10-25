# Rename kipos to nomi

State: DONE
Branch: chore/rename-kipos-to-nomi (stacked on chore/strip-fde-copilot)
Worktree: .claude/worktrees/rename-kipos-to-nomi-22cf6d
Base SHA: ddf1352
Head SHA: 6a97f8d
Depends on: chore/strip-fde-copilot

## Goal

The product is a Grok bot for students named nomi. Rename the project inside
the repository so the design-system work (PR B onward) starts under the final
name and is not mixed with the rename.

## Scope

Expected paths: package names `@kipos/*` to `@nomi/*` and every import,
README, AGENTS files, current-state docs, wordmark and page titles, oxlint and
structure-test patterns, `bun.lock`.
Shared/high-contention paths: every `package.json`, `bun.lock`,
`tooling/oxlint.json`, AGENTS files.
Must not modify: historical work records (`docs/work/completed/`) and ADR text
(`docs/decisions/`), which stay as written. Anything outside the repository
(folders, worktrees, GitHub repo, git remote) is a separate, owner-approved
step.

## Acceptance

- `git grep -i kipos` matches only `docs/work/completed/` and `docs/decisions/`.
- `bun run verify` is green.

## Decisions

- ADR file names and text keep `kipos`; the rename is recorded in ADR 0008
  (PR B).
- The default database path documented in the playbook becomes
  `./data/nomi.sqlite`; no code reads it yet.

## Verification

- [x] targeted tests
- [x] bun run verify

## Remaining

Done after this PR was opened (2026-10-24): `gh repo rename` to `enkyuan/nomi`
and `git remote set-url origin`. Still left to the owner: `mv` of the checkout
and worktree folders and `git worktree repair`, once no session has a worktree
open there.
