# Kipos

An AI copilot for Forward Deployed Engineers. It shadows a Google Meet
through a Vexa notetaker, shows the live, speaker-attributed transcript, and
keeps the client's requirements and implementation gaps (with suggested
questions) current in a private side panel. A Bun + Elysia API and a
TanStack Start workspace, styled with coss/ui primitives on StyleX.

```bash
bun install
cp apps/api/.env.example apps/api/.env   # VEXA_API_KEY, Bedrock credentials
bun run dev        # web http://localhost:3000 · api http://localhost:3001
bun run verify     # the full gate: check + test + build
```

In development, the Agentation toolbar (bottom right) annotates elements of
the running app for agents. Live acceptance steps:
[docs/testing.md](docs/testing.md#live-acceptance).

| Path          | What                                                                |
| ------------- | ------------------------------------------------------------------- |
| `apps/api`    | HTTP API (Elysia, SQLite), Vexa and Anthropic integrations          |
| `apps/web`    | FDE workspace (TanStack Start, StyleX)                              |
| `packages/ui` | Design system: coss/ui on Base UI + StyleX                          |
| `docs/`       | Product, architecture, invariants, testing, decisions, work records |

Start with [AGENTS.md](AGENTS.md): it is the working agreement for humans and
agents alike.
