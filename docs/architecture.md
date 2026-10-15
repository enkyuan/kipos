# Architecture

## Components

```text
browser ──▶ apps/web (TanStack Start, SSR)          :3000
   │             renders pages; serves assets
   │
   └── /api/* ──▶ apps/api (Bun + Elysia)           :3001
                     │  /health, /api/*
                     │  ──▶ Vexa: POST /bots, /ws stream, GET /transcripts
                     │  ◀── Vexa: POST /api/webhooks/vexa (optional, signed)
                     │  ──▶ Anthropic: analysis (optional)
                     ▼
                  SQLite (bun:sqlite, WAL)          apps/api/data/kipos.sqlite
```

| Package              | Owns                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| `apps/api`           | The HTTP API: validation, product rules, persistence, migrations, the Vexa and Anthropic integrations. |
| `apps/web`           | Pages, routing, server rendering, the typed API client.                                                |
| `packages/ui`        | Design tokens and accessible primitives (coss/ui on StyleX).                                           |
| `apps/claude-plugin` | Claude Code plugin: MCP tools for client context and clarifications.                                   |
| `apps/dial-service`  | Vercel functions: Dial calls and texts to client stakeholders.                                         |
| `packages/tsconfig`  | Shared compiler options.                                                                               |

## Claude Code integration

```text
Claude Code ──▶ apps/claude-plugin (MCP over stdio, bundled in dist/)
                   │  HTTPS, bearer token, engagement_id
                   ▼
               apps/dial-service (Vercel) ──▶ Dial API ──▶ phone call / SMS
                   ▲                              │
                   └──── signed webhook ◀─────────┘
```

Neither app imports the other or any other workspace; they share only the
HTTP contract in `apps/claude-plugin/README.md`.

## Dependency direction

```text
apps/web ──types only──▶ apps/api ──▶ elysia, bun:sqlite, Vexa, Anthropic
   │
   └──▶ packages/ui ──▶ @base-ui/react, @stylexjs/stylex
```

- `apps/web` imports `type App` (and the meeting record types) from
  `@kipos/api` and builds an Eden client from it. No API runtime code reaches
  the web bundle, and no provider key ever leaves `apps/api`.
- `packages/ui` knows nothing about either app.
- Enforced by `tooling/oxlint.json` (import boundaries) and
  `tooling/checks/structure.test.ts`.

## Request flow

1. The browser loads a page from `apps/web`; Start renders it on the server.
   `/` is the meetings grid (`GET /api/meetings`, newest first) with a "New
   meeting" tile whose dialog starts shadowing; `/meetings/$meetingId` is one
   meeting's live status and transcript.
2. Client code calls the API on the page's own origin under `/api`
   (`apiClient().api.meetings.post(...)` → `POST /api/meetings`).
3. In development and `vite preview`, Vite proxies `/api/*` to `API_ORIGIN`
   (default `http://localhost:3001`) with the path unchanged: the API serves
   the same `/api/...` paths the browser and providers use.
4. In production, the reverse proxy in front of both apps must apply the same
   rule. The API sets no CORS headers: it is only reached same-origin.

## Meeting ingestion

```text
POST /api/meetings ─▶ session (requested) ─▶ Vexa POST /bots
                                            └▶ watcher: /ws subscribe (google_meet, code)
Vexa /ws frames ──────────────┐   confirmed segments, meeting.status
GET /transcripts (catch-up) ──┼─▶ ingestEvents ─▶ transcript_utterances (by segment id)
POST /api/webhooks/vexa ──────┘                  meeting_status_reports ─▶ derived status
  (verify → inbox → 200 → drain)                 ─▶ live feed ─▶ SSE ─▶ browser
                                                 ─▶ analysis scheduler (notify)
```

- **The stream is the fast path; the REST record is the safety net**
  (on subscribe, on a terminal status, every 15 s). Ingestion is idempotent,
  so every path may repeat what another delivered.
- **Status is derived** from every stored report, so delivery order cannot
  change it (`meetings/status.ts`).
- **Live channel.** `GET /api/meetings/:id/events` subscribes, then replays
  the session, transcript and analysis, then streams changes. Clients merge
  by id. `draft` events (each speaker's words in progress) are live only:
  never stored or replayed.
- Code: `apps/api/src/meetings/` (`routes.ts`, `vexa-client.ts`,
  `vexa-stream.ts`, `vexa-events.ts`, `ingest.ts`, `status.ts`, `store.ts`,
  `webhook-routes.ts`), `apps/web/src/features/meetings/`. Decisions:
  `docs/decisions/0003-meeting-ingestion.md`.

## Requirement analysis

```text
ingestion ─notify─▶ scheduler (per meeting: cursor, one cycle at a time)
  batch ≈ 25 s of new utterances + 30 lines of context + recorded state
  ─▶ Claude (forced record_analysis tool) ─▶ TypeBox validation
  ─▶ planChanges (evidence, dedupe, resolution, dismissal, confirmation)
  ─▶ business_requirements / candidate_issues + cursor (one transaction)
  ─▶ live feed ─▶ FDE side panel
```

Code: `apps/api/src/analysis/`, `apps/web/src/features/analysis/`.
Decisions: `docs/decisions/0004-requirement-analysis.md`. The analysis
feature reads the transcript through an interface (`TranscriptReader`) that
`server.ts` satisfies with the meetings store; the two features never import
each other.

## API composition

`server.ts` reads the environment, opens the database, builds the stores,
the live feed, the Vexa watcher and notetaker, and (with a model key) the
analysis scheduler, and calls `createApp(deps)`.
`createApp` composes one Elysia plugin per feature plus the error boundary,
and is a pure function of its dependencies. Tests call
`createApp(...).handle(request)` directly, with fakes in place of Vexa and
the model.

## Styling

StyleX compiles every `stylex.create` call at build time into atomic CSS,
appended to `apps/web/src/app.css` in production and served from
`/virtual:stylex.css` in development. Cascade layers order it: `@layer base`
(the coss base layer from `@kipos/ui/base.css`) below StyleX's `priority*`
layers, so a component style always wins over a base rule.

Light and dark themes follow `prefers-color-scheme` through the color tokens.
Typography pairs EB Garamond (headings, wordmark) with Inter (everything
else); brand colors are OKLCH ramps exposed through brand roles
(`docs/decisions/0002-brand-typography-and-palette.md`).

In development, the root shell mounts Agentation (`src/dev-annotations.tsx`),
a toolbar for annotating elements of the running app; it is absent from
production builds.
