# Architecture

## Components

```text
browser ──▶ apps/web (TanStack Start, SSR)          :3000
   │             renders pages; serves assets
   │
   └── /api/* ──▶ apps/api (Bun + Elysia)           :3001
                     │  /health, /api/*
                     ▼
                  SQLite (bun:sqlite, WAL)          apps/api/data/ouro.sqlite
```

| Package             | Owns                                                                 |
| ------------------- | -------------------------------------------------------------------- |
| `apps/api`          | The HTTP API: validation, product rules, persistence, migrations.    |
| `apps/web`          | Pages, routing, server rendering, the typed API client.              |
| `packages/ui`       | Design tokens, fonts, and accessible primitives (Base UI on StyleX). |
| `packages/tsconfig` | Shared compiler options.                                             |

## Dependency direction

```text
apps/web ──types only──▶ apps/api ──▶ elysia, bun:sqlite
   │
   ├──▶ packages/ui ──▶ @base-ui/react, @stylexjs/stylex
   └──▶ motion, blode-icons-react, @blobatar/react, dialkit
```

- `apps/web` imports `type App` from `@ouro/api` and builds an Eden client
  from it. No API runtime code reaches the web bundle.
- `packages/ui` knows nothing about either app.
- Enforced by `tooling/oxlint.json` (import boundaries) and
  `tooling/checks/structure.test.ts`.

## Request flow

1. The browser loads a page from `apps/web`; Start renders it on the server.
2. Client code calls the API on the page's own origin under `/api`
   (`apiClient().api.<path>`).
3. In development and `vite preview`, Vite proxies `/api/*` to `API_ORIGIN`
   (default `http://localhost:3001`) with the path unchanged: the API serves
   the same `/api/...` paths the browser uses.
4. In production, the reverse proxy in front of both apps must apply the same
   rule. The API sets no CORS headers: it is only reached same-origin.

## API composition

`server.ts` reads the environment, opens the database (applying
migrations), and calls `createApp()`. `createApp` composes one Elysia plugin
per feature plus the error boundary; a feature that needs storage or a
provider receives it as an argument, so tests call
`createApp(...).handle(request)` directly with fakes.

## Styling

StyleX compiles every `stylex.create` call at build time into atomic CSS,
appended to `apps/web/src/app.css` in production and served from
`/virtual:stylex.css` in development. Cascade layers order it: `@layer base`
(`@ouro/ui/base.css`) below StyleX's `priority*` layers, so a component style
always wins over a base rule.

Light and dark themes follow `prefers-color-scheme` through the color tokens.
Typography pairs Zodiak (headings, wordmark) with Glide (everything else)
and Glide Mono (code). Color follows a 60 / 30 / 10 split of paper, graphite
and peach in OKLCH, exposed through semantic roles
(`docs/decisions/0008-notebook-design-system.md`). The design kit is recorded
in `docs/decisions/0007-base-ui-design-kit.md`.

In development, the root shell mounts `src/dev-tools.tsx`: Agentation (a
toolbar for annotating elements for agents) and the DialKit panel (live
controls for values a component registers with `useDialKit`). Neither panel
is in production builds.
