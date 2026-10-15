# Repository scaffold

State: DONE
Branch: main (initial scaffold, not yet committed)
Base SHA: none
Head SHA: uncommitted
Completed: 2026-10-11

## Goal

A repository set up for fast iteration: a Bun + Elysia API, a web surface
with a landing page, and coss/ui as the design system on StyleX, with the
working agreement (AGENTS.md) adapted from ryo and kaji.

## Final behavior

- `apps/api`: `/health`; `POST /v1/waitlist` (202, idempotent, no membership
  oracle); typed `ApiError`; SQLite with append-only migrations.
- `apps/web`: server-rendered landing page (header, hero with waitlist form,
  feature cards, footer), not-found page, Eden client typed from the API.
- `packages/ui`: coss tokens (light and dark) and Button, Badge, Card, Input,
  Field, Form, Separator, translated to StyleX.

## Decisions

- Recorded in `docs/decisions/0001-stack.md`.
- coss components are translated, not installed (the coss CLI emits
  Tailwind); the translation rules live in `packages/ui/AGENTS.md`.
- `createApp` is a pure function of its dependencies so the type graph the
  web compiles never reaches `bun:sqlite`.
- The web dev port is `WEB_PORT` (default 3000) with `strictPort`, so a busy
  port fails loudly instead of silently moving.

## Verification

- `bun run verify`: format, lint, typecheck (3 workspaces), knip, 11 API
  tests, 2 ui tests, 3 SSR build tests, 6 structure tests, build — all pass.
- Live: through the web dev proxy, a join returns 202 and writes one row; a
  repeat in another letter case returns the same body and writes nothing; an
  invalid email returns 422 `invalid_request`. Browser: desktop and 375px
  layouts render; an invalid email shows the field error with focus kept; a
  valid email shows the confirmation; no console errors.
- Boundary guards proven by temporary violations, each rejected: vague
  filename, runtime `@kipos/api` import in web, `@kipos/ui` in the API, palette
  in a primitive, router in ui, unexported primitive, deep import into ui
  source, API route rename (web typecheck), unpinned version, invalid task
  state.

## Known limitations

- No rate limiting on `POST /v1/waitlist`.
- No deployment configuration; production needs a proxy that forwards
  `/api/*` to the API with the prefix stripped (`docs/architecture.md`).
- Landing copy is placeholder until `docs/product.md` is written.
- Dark mode follows the system preference only; there is no manual toggle.

## Follow-up

- Decide the product (`docs/product.md`), then replace the landing copy.
- Add deployment (Dockerfiles or a platform config) when a target is chosen.
