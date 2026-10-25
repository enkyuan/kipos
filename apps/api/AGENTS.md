# AGENTS.md — `apps/api`

The root `AGENTS.md` governs this package; this file is only the backend delta.

## Stack

Bun runtime, Elysia for HTTP, `bun:sqlite` for durable state. No ORM: SQL is
explicit and lives beside the store that owns it.

## Shape

```text
src/server.ts         the only module that reads the environment or opens
                      resources; it composes and listens
src/app.ts            createApp() → Elysia; exports `type App` for Eden
src/env.ts            configuration parsing; invalid values fail startup
src/database.ts       opens SQLite and applies migrations/ (server.ts calls it
                      once a feature stores data)
src/errors.ts         the one error shape (`apiErrorSchema`, `apiError`) and
                      the boundary that maps failures to it
src/<feature>/
  routes.ts           an Elysia plugin: schemas, handlers, and the store
                      interface the routes consume (a feature may have more
                      than one routes file)
  store.ts            the SQLite implementation of that interface
  *.test.ts           guarantees, through createApp(...).handle(request)
migrations/           <UTC timestamp>_<name>.sql, immutable once merged
```

Adding a feature: follow `docs/playbooks/add-api-feature.md`.

## Rules

- **`app.ts` is a pure function of its dependencies** (none yet; a feature that
  needs storage or a service adds them as arguments). It never reads
  `Bun.env`, opens files, or imports `bun:*`. This keeps the type graph that
  `apps/web` compiles (through Eden) free of runtime-only modules, and lets
  tests run without a port.
- **Features never import each other** (oxlint). Shared code is a
  top-level module in `src/`.
- **Interfaces live with their consumer.** A feature's `routes.ts` declares
  what it needs from storage; `store.ts` satisfies it structurally.
- **Every product route declares its schemas** (`body`, `params`, `query`,
  and `response` per status). They are the HTTP contract and the source of the
  web client's types; a contract change is a type error in `apps/web` once it
  has a client. Operational routes (`/health`) are exempt.
- **One error shape.** Non-2xx responses are `ApiError`
  (`{ error: { code, message } }`): declare `apiErrorSchema` per failure
  status and fail with `throw status(code, apiError(...))`. Never return raw
  SQL, stack traces, or an unexpected error's message; `errors.ts` logs the
  cause once.
- **Public paths.** Product endpoints live under `/api/`, the path the browser
  uses (through the `/api` proxy the first API call adds to `apps/web`);
  operational ones (`/health`) do not.
- **External services sit behind an interface** declared by their consumer,
  built in `server.ts`, and replaced by a fake in tests. Their credentials
  never leave `server.ts`'s configuration.
- **Model output is untrusted input.** Validate it against its schema, then
  apply it through code that enforces the invariants; never write a model's
  answer directly.
- **Uniqueness and integrity belong to the database** where it can prove them
  (primary keys, `UNIQUE`, `CHECK`, `STRICT` tables), not only to code.
- **Migrations are append-only.** Never edit a merged migration; add a new
  one. Each applies in a transaction with its record. One exception: before
  the first release, with no deployed database, they may be removed, and the
  task record says so (`docs/work/completed/strip-meeting-copilot.md`).
- **Time is UTC ISO-8601** when persisted.
