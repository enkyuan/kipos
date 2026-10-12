# Ouro

An AI copilot for Forward Deployed Engineers, at its base scaffold: a Bun +
Elysia API and a TanStack Start web app, styled with Base UI primitives on
StyleX.

```bash
bun install
bun run dev        # web http://localhost:3000 · api http://localhost:3001
bun run verify     # the full gate: check + test + build
```

The home page is the design kit: type (EB Garamond, Glide, Glide Mono),
buttons, Blode icons, Blobatar avatars and Motion springs. In development,
the Agentation toolbar annotates elements for agents and the DialKit panel
tunes the values a component registers with `useDialKit`.

| Path          | What                                                                |
| ------------- | ------------------------------------------------------------------- |
| `apps/api`    | HTTP API (Elysia, SQLite)                                           |
| `apps/web`    | Web app (TanStack Start, StyleX)                                    |
| `packages/ui` | Design system: Base UI + StyleX, tokens, fonts                      |
| `docs/`       | Product, architecture, invariants, testing, decisions, work records |

Start with [AGENTS.md](AGENTS.md): it is the working agreement for humans and
agents alike.
