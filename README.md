# Ouro

A Bun + Elysia API and a TanStack Start web surface (landing page + waitlist),
styled with coss/ui primitives on StyleX.

```bash
bun install
bun run dev        # web http://localhost:3000 · api http://localhost:3001
bun run verify     # the full gate: check + test + build
```

| Path          | What                                                                |
| ------------- | ------------------------------------------------------------------- |
| `apps/api`    | HTTP API (Elysia, SQLite)                                           |
| `apps/web`    | Web app and landing page (TanStack Start, StyleX)                   |
| `packages/ui` | Design system: coss/ui on Base UI + StyleX                          |
| `docs/`       | Product, architecture, invariants, testing, decisions, work records |

Start with [AGENTS.md](AGENTS.md): it is the working agreement for humans and
agents alike.
