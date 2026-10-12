# AGENTS.md — `apps/api`

The root `AGENTS.md` governs this package; this file is only the backend delta.

## Stack

Bun runtime, Elysia for HTTP, `bun:sqlite` for durable state. No ORM: SQL is
explicit and lives beside the store that owns it.

## Shape

```text
src/server.ts         the only module that reads the environment or opens
                      resources; it composes and listens
src/app.ts            createApp(deps) → Elysia; exports `type App` for Eden
src/stores.ts         (with the first store) createStores(db): every
                      feature's real store, used by server.ts and tests
src/env.ts            configuration parsing; invalid values fail startup
src/database.ts       opens SQLite and applies migrations/
src/errors.ts         the one error shape (`apiErrorSchema`, `apiError`) and
                      the boundary that maps failures to it
src/<feature>/
  routes.ts           an Elysia plugin: schemas, handlers, and the store
                      interface the routes consume (a feature may have more
                      than one routes file, e.g. webhook-routes.ts)
  store.ts            the SQLite implementation of that interface
  *.test.ts           guarantees, through createApp(...).handle(request)
migrations/           <UTC timestamp>_<name>.sql, immutable once merged
```

Adding a feature: follow `docs/playbooks/add-api-feature.md`.

## Rules

- **`app.ts` is a pure function of its dependencies.** It never reads
  `Bun.env`, opens files, or imports `bun:*`. This keeps the type graph that
  `apps/web` compiles (through Eden) free of runtime-only modules, and lets
  tests run without a port.
- **Features never import each other** (oxlint). Shared code is a
  top-level module in `src/`.
- **Interfaces live with their consumer.** A feature's `routes.ts` declares
  what it needs from storage; `store.ts` satisfies it structurally.
- **Every route declares its schemas** (`body`, `params`, `query`, and
  `response` per status). They are the HTTP contract and the source of the web
  client's types; a contract change is a type error in `apps/web`.
- **One error shape.** Non-2xx responses are `ApiError`
  (`{ error: { code, message } }`): declare `apiErrorSchema` per failure
  status and fail with `throw status(code, apiError(...))`. Never return raw
  SQL, stack traces, or an unexpected error's message; `errors.ts` logs the
  cause once.
- **Public paths.** Product endpoints live under `/api/`, the same path the
  browser (through the web proxy) and providers (through a tunnel) use;
  operational ones (`/health`) do not.
- **Provider webhooks** verify the signature over the raw body
  (`parse: "none"`) before reading anything, store the delivery, acknowledge,
  and process afterwards.
- **External services sit behind an interface** declared by their consumer
  (a `Notetaker`, an `Analyzer`), built in `server.ts`, and
  replaced by a fake in tests. Their credentials never leave `server.ts`'s
  configuration.
- **Model output is untrusted input.** Validate it against its schema, then
  apply it through code that enforces the invariants; never write a model's
  answer directly.
- **Uniqueness and integrity belong to the database** where it can prove them
  (primary keys, `UNIQUE`, `CHECK`, `STRICT` tables), not only to code.
- **Migrations are append-only.** Never edit a merged migration; add a new
  one. Each applies in a transaction with its record.
- **Time is UTC ISO-8601** when persisted.
