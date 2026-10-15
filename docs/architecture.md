# Architecture

## Components

```text
browser ──▶ apps/web (TanStack Start, SSR)          :3000
   │             renders pages; serves assets
   │
   └── /api/* ──▶ apps/api (Bun + Elysia)           :3001
                     │  /health, /api/*
                     ▼
                  SQLite (bun:sqlite, WAL)          opened once a feature stores data
```

| Package             | Owns                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `apps/api`          | The HTTP API: validation, product rules, persistence, migrations. |
| `apps/web`          | Pages, routing, server rendering.                                 |
| `packages/ui`       | Design tokens and accessible primitives (coss/ui on StyleX).      |
| `packages/tsconfig` | Shared compiler options.                                          |

## Dependency direction

```text
apps/web ──types only──▶ apps/api ──▶ elysia, bun:sqlite
   │
   └──▶ packages/ui ──▶ @base-ui/react, @stylexjs/stylex
```

- Once `apps/web` calls the API, it imports `type App` from `@kipos/api` and
  builds an Eden client from it (`docs/playbooks/add-api-feature.md`). No API
  runtime code reaches the web bundle, and no secret ever leaves `apps/api`.
- `packages/ui` knows nothing about either app.
- Enforced by `tooling/oxlint.json` (import boundaries) and
  `tooling/checks/structure.test.ts`.

## Request flow

1. The browser loads a page from `apps/web`; Start renders it on the server.
2. Client code calls the API on the page's own origin under `/api`
   (the Eden client, added with the first call).
3. The first API call adds a `/api` proxy to `apps/web/vite.config.ts` for
   development and `vite preview` (target `API_ORIGIN`, default
   `http://localhost:3001`, path unchanged), so the API serves the same
   `/api/...` paths the browser uses.
4. In production, the reverse proxy in front of both apps must apply the same
   rule. The API sets no CORS headers: it is only reached same-origin.
