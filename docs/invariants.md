# Invariants

Truths every change must preserve. Each names the test that proves it.

## Waitlist

- **One entry per address.** Joining twice, in any letter case, leaves one
  row. Enforced by the `waitlist_entries` primary key (`COLLATE NOCASE`) and
  lowercase normalization. Proven in `apps/api/src/waitlist/routes.test.ts`.
- **No membership oracle.** A new and a repeated join return the same status
  and body (202 `{ "status": "accepted" }`), so the endpoint cannot reveal
  whether an address is listed. Proven in the same file.
- **Invalid input records nothing.** A rejected request (422) leaves the
  database unchanged.

## API

- **One error shape.** Every failure the error boundary handles is an
  `ApiError`: bad requests are 422, a response that breaks its own schema is
  500 (our bug, not the client's), `throw status(code, apiError(...))` keeps
  its status, and unexpected errors are logged once and answered with a
  generic message that never echoes the cause. A handler that _returns_
  `status(4xx, body)` bypasses the boundary; declaring `apiErrorSchema` for
  that status makes a wrong body fail response validation. Proven in
  `apps/api/src/errors.test.ts`.
- **Migrations apply exactly once,** each in a transaction with its record:
  a failing migration leaves nothing behind and is not recorded. Proven in
  `apps/api/src/database.test.ts`.
- **Startup fails on invalid configuration** rather than falling back.
  Proven in `apps/api/src/env.test.ts`.

## Boundaries

- **No API runtime in the web bundle.** Only `apps/web/src/api/client.ts`
  imports `@ouro/api`, and with `import type` only. Proven in
  `tooling/checks/structure.test.ts`.
- **Features never import each other**, in either app. Enforced by
  `tooling/oxlint.json`.
- **Every ui primitive is public and every export resolves.** Proven in
  `packages/ui/test/exports.test.ts`.
- **The landing page server-renders** with its stylesheet linked. Proven in
  `apps/web/test/build/landing.test.ts`.
