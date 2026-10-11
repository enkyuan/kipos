# Add an API feature

1. **Migration** (if it stores data): `apps/api/migrations/<UTC yyyymmddHHMMSS>_<name>.sql`.
   Prefer `STRICT` tables and database-enforced uniqueness.
2. **Routes**: `apps/api/src/<feature>/routes.ts` exports
   `<feature>Routes(deps)` returning an Elysia plugin. Declare `body`,
   `params`/`query`, and `response` schemas per status, with
   `apiErrorSchema` for each failure status (422 at least). Fail with
   `throw status(code, apiError("code", "Message."))`. Declare the store
   interface the routes need here, by its consumer. Never import another
   feature's folder.
3. **Store**: `apps/api/src/<feature>/store.ts` exports
   `create<Feature>Store(db)` implementing that interface with SQL.
4. **Compose**: add the dependency to `AppDependencies` and `.use(...)` the
   plugin in `src/app.ts`; construct its store in `src/stores.ts`.
5. **Test**: `src/<feature>/routes.test.ts` through
   `createApp({ ...createStores(openDatabase(":memory:")), ... }).handle(request)`, with fakes for external services (see `apps/api/src/meetings/fixtures.ts`). Cover
   the success path, each failure state, and the durable state after each.
6. **Use it from the web**: call `apiClient().api.<path>` inside a feature
   function that maps the outcome to what a person sees (see
   `apps/web/src/features/meetings/start-shadowing.ts`).
7. **Record**: update `docs/invariants.md` if the feature adds a guarantee.

`bun run verify` must pass.
