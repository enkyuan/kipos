# Kipos

A Grok bot for students. Early development: a Bun + Elysia API and a
TanStack Start web app, styled with coss/ui primitives on StyleX.

```bash
bun install
bun run dev        # web http://localhost:3000 · api http://localhost:3001
bun run verify     # the full gate: check + test + build
```

In development, the Agentation toolbar (bottom right) annotates elements of
the running app for agents.

| Path          | What                                                                |
| ------------- | ------------------------------------------------------------------- |
| `apps/api`    | HTTP API (Elysia, SQLite)                                           |
| `apps/web`    | Web app (TanStack Start, StyleX)                                    |
| `packages/ui` | Design system: coss/ui on Base UI + StyleX                          |
| `docs/`       | Product, architecture, invariants, testing, decisions, work records |

Start with [AGENTS.md](AGENTS.md): it is the working agreement for humans and
agents alike.
