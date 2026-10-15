# Add an API feature

1. **Migration** (if it stores data): `apps/api/migrations/<UTC yyyymmddHHMMSS>_<name>.sql`.
   Prefer `STRICT` tables and database-enforced uniqueness.
2. **Routes**: `apps/api/src/<feature>/routes.ts` exports
   `<feature>Routes(deps)` returning an Elysia plugin mounted under
   `/api/<feature>` (`new Elysia({ prefix: "/api/<feature>" })`), the path the
   browser calls; operational routes such as `/health` stay unprefixed. Declare `body`,
   `params`/`query`, and `response` schemas per status, with
   `apiErrorSchema` for each failure status (422 and 400 at least). Fail with
   `throw status(code, apiError("code", "Message."))`. Declare the store
   interface the routes need here, by its consumer. Never import another
   feature's folder.
3. **Store**: `apps/api/src/<feature>/store.ts` exports
   `create<Feature>Store(db)` implementing that interface with SQL.
4. **Compose**: `.use(...)` the plugin in `src/app.ts`. When it needs a store
   or an external service, make `createApp` take it as an argument and build
   the real one in `src/server.ts` (the first stored feature also opens the
   database there with `openDatabase`, adds `DATABASE_PATH` back to `env.ts` (default `./data/kipos.sqlite`, and in
   `apps/api/.env.example`), and closes it on shutdown).
5. **Test**: `src/<feature>/routes.test.ts` through
   `createApp(...).handle(request)` with `openDatabase(":memory:")` and fakes for external services. Cover
   the success path, each failure state, and the durable state after each.
6. **Use it from the web**: if this is the first call, create
   `apps/web/src/api/client.ts` exporting `function apiClient()` that returns
   `treaty<App>(window.location.origin)` (with `import type { App } from
   "@kipos/api"`; browser only: call it from handlers or effects, never at
   module scope or in a loader, because Start server-renders), add the `#api/*` alias (`./src/api/*`) to `apps/web/package.json` and
   `tsconfig.json`, add `@elysiajs/eden`, `@kipos/api` and `elysia` to
   `apps/web`, and add the `/api` dev and preview proxy (target `API_ORIGIN`,
   default `http://localhost:3001`, path unchanged) to `vite.config.ts`,
   documenting `API_ORIGIN` in `apps/web/.env.example`. Then call `apiClient().api.<path>` inside a feature
   function that maps the outcome to what a person sees (one function per call, returning an outcome type).
7. **Record**: update `docs/invariants.md` if the feature adds a guarantee.

`bun run verify` must pass.
