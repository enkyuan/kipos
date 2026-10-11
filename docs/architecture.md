# Architecture

## Components

```text
browser ──▶ apps/web (TanStack Start, SSR)        :3000
   │             renders pages; serves assets
   │
   └── /api/* ──▶ apps/api (Bun + Elysia)         :3001
                     │  /health, /v1/*
                     ▼
                  SQLite (bun:sqlite, WAL)        apps/api/data/ouro.sqlite
```

| Package             | Owns                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `apps/api`          | The HTTP API: validation, product rules, persistence, migrations. |
| `apps/web`          | Pages, routing, server rendering, the typed API client.           |
| `packages/ui`       | Design tokens and accessible primitives (coss/ui on StyleX).      |
| `packages/tsconfig` | Shared compiler options.                                          |

## Dependency direction

```text
apps/web ──types only──▶ apps/api ──▶ elysia, bun:sqlite
   │
   └──▶ packages/ui ──▶ @base-ui/react, @stylexjs/stylex
```

- `apps/web` imports `type App` from `@ouro/api` and builds an Eden client from
  it. No API runtime code reaches the web bundle.
- `packages/ui` knows nothing about either app.
- Enforced by `tooling/oxlint.json` (import boundaries) and
  `tooling/checks/structure.test.ts`.

## Request flow

1. The browser loads `/` from `apps/web`; Start renders it on the server.
2. Client code calls `apiClient().v1.waitlist.post(...)`, which requests
   `/api/v1/waitlist` on the page's own origin.
3. In development and `vite preview`, Vite proxies `/api/*` to `API_ORIGIN`
   (default `http://localhost:3001`), stripping `/api`.
4. In production, the reverse proxy in front of both apps must apply the same
   rule. The API sets no CORS headers: it is only reached same-origin.

## API composition

`server.ts` reads the environment, opens the database, and calls
`createApp(deps)`. `createApp` composes one Elysia plugin per feature plus the
error boundary, and is a pure function of its dependencies. Tests call
`createApp(...).handle(request)` directly.

## Styling

StyleX compiles every `stylex.create` call at build time into atomic CSS,
appended to `apps/web/src/app.css` in production and served from
`/virtual:stylex.css` in development. Cascade layers order it: `@layer base`
(the coss base layer from `@ouro/ui/base.css`) below StyleX's `priority*`
layers, so a component style always wins over a base rule.

Light and dark themes follow `prefers-color-scheme` through the color tokens.
Typography pairs EB Garamond (headings, wordmark) with Inter (everything
else); brand colors are OKLCH ramps exposed through brand roles
(`docs/decisions/0002-brand-typography-and-palette.md`).
