# 0001 — Stack

Date: 2026-10-11
Status: accepted

## Context

Kipos needs a small backend and a public web surface that can change quickly
without losing correctness, built by humans and agents in parallel.

## Decision

- **Bun workspaces monorepo**: one install, one lockfile, one toolchain
  (`bun test`, `bun --watch`), exact-pinned versions.
- **API: Bun + Elysia + `bun:sqlite`.** Elysia's route schemas are the HTTP
  contract and the source of the client's types; SQLite is durable, built into
  the runtime, and needs no service to run locally. Move to PostgreSQL when
  concurrent writers or multiple API instances require it (a new ADR).
- **Web: TanStack Start + Router** for server rendering and file-based routes,
  so pages ship HTML and later product surfaces fit the same app.
- **Eden** for the API client: `apps/web` compiles against `type App`, so a
  contract change is a type error, with no code generation step. The client
  is added with the first API call, not before.
- **Design system: coss/ui on StyleX.** coss provides accessible Base UI
  primitives and a coherent base theme; StyleX replaces Tailwind so styles are
  typed, colocated, compiled to atomic CSS, and composable through `xstyle`
  without class-string merging.
- **Tooling: oxfmt, oxlint, tsc, knip**, plus repository structure tests.

## Consequences

- coss components are translated, not installed: the coss CLI emits Tailwind.
  `packages/ui/AGENTS.md` defines the translation.
- StyleX cannot express descendant selectors; those few rules live in
  `@kipos/ui/base.css`, keyed on `data-slot`.
- SQLite limits the API to one writer process. That is the current scale.
- The API does not open the database until a feature stores data
  (`openDatabase` in `src/database.ts` is ready and tested).
