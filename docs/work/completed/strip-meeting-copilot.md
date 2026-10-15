# Strip the meeting copilot

State: DONE
Branch: chore/strip-fde-copilot (stacked on chore/rename-ouro-to-kipos)
Base SHA: 9912c068a3e511fe17c75b9143d0da3a91aed35f
Head SHA: uncommitted (set at commit)
Completed: 2026-10-15

## Goal

Kipos is now a Grok bot for students. Remove everything that belonged to the
FDE meeting copilot, and keep only the shell the new product builds on.

## Changed

- Deleted `apps/claude-plugin`, `apps/dial-service` and `apps/superpower-landing`.
- API: removed meetings, Vexa ingestion, requirement analysis, the live feed,
  the Bedrock dependency and its configuration. `createApp()` serves
  `GET /health` through the error boundary; `readEnv` reads only `PORT`.
  The server no longer opens SQLite (`openDatabase` stays, tested, for the
  first stored feature).
- Migrations: all four removed (waitlist, drop waitlist, meeting ingestion,
  requirement analysis). This is the pre-release exception to "append-only":
  no deployed database existed.
- Web: one home page and the not-found page. Removed the meetings and analysis
  features, the Eden client and its dependencies, `motion`, the `/api` dev
  proxy and the `#api/*` alias. Each returns with the first API call or the
  first feature that needs it (`docs/playbooks/add-api-feature.md`).
- `packages/ui`: kept the tokens and base layer; deleted the 12 primitives and
  the toast primitive that nothing used; Button lost its unused `loading` prop.
- Docs: product, architecture, invariants, testing, AGENTS files and the
  playbook describe only what exists; ADRs 0003 to 0006 and the old work
  records were deleted.

## Decisions

- No model provider is chosen. Bedrock and its configuration were removed with
  the analysis code; a new ADR records the choice when the first feature calls
  a model.
- The heading font now applies to the home and not-found titles, per the brand
  rule in `apps/AGENTS.md`.

## Verification

- [x] `bun run verify` (api 13, ui 2, web 4, tooling 6 tests)
- [x] Smoke against the production build and a live API on isolated ports:
      health, typed 404, startup failure on an invalid `PORT`, home page, not-found
      page, graceful shutdown.

## Known limitations

- A local `apps/api/data/kipos.sqlite` created by the old migrations keeps their
  tables, and a later migration that reuses a name would fail on it. Delete the
  file and its `-wal` and `-shm` files after pulling this change.
- A stale `apps/api/.env` with `VEXA_*`, `AWS_*` or `ANALYSIS_MODEL` entries is
  ignored; delete those lines.
- `apps/api/src/server.ts` boot, startup-failure and shutdown paths have no
  automated test.
- Left out of scope: `WEB_PORT` is not validated like `PORT`, and
  `.github/workflows/ci.yml` has no `permissions:` block and unpinned actions.

Follow-ups raised in review, not done here:

- No test asserts the 422 `invalid_request` branch of `errors.ts`; the
  `errors.test.ts` cases cover the 404, 400 parse, response-schema 500,
  unexpected-error 500 and thrown-status paths only.
- `@sinclair/typebox` is only an Elysia peer dependency, locked at 0.34.52 in
  `bun.lock` with no direct pin in any `package.json`.
- The `App` type export in `apps/api/src/app.ts` has no consumer until the
  first API call adds the Eden client.
- Button focus ring: forced-colors mode and the ring's contrast in light mode
  are unchecked.
- `database.ts` (dormant, not opened at startup): the migration runner has a
  race between concurrent processes, and nothing compares the applied
  migrations with the files on disk to catch drift.
- `server.ts` has no server hardening and no shutdown timeout: `shutDown`
  awaits `app.stop()` with no upper bound.
- The wordmark link in `page-frame.tsx` has no `:focus-visible` style.

## Outside the repository

Not done by this change; the owner completes these by hand:

- The Vercel deployment of the deleted `apps/dial-service` (project
  `superpower-dial-service`) and its environment keys: remove the project and
  rotate or revoke the keys.
- Revoke or retire the Vexa, AWS/Bedrock and Dial keys the removed code used.
- Delete the Vexa webhook registration that pointed at the removed
  `/api/webhooks/vexa` route.
- Remove copies of the deleted Claude plugin (`superpower@kipos`) installed
  with `claude plugin install`; Claude Code copied its folder on install.
