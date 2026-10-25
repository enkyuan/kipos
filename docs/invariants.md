# Invariants

Truths every change must preserve. Each names the test that proves it.

## API

- **One error shape.** Every failure the error boundary handles is an
  `ApiError`: bad requests are 422, an unparsable body is 400, a response that breaks its own schema is
  500 (our bug, not the client's), `throw status(code, apiError(...))` keeps
  its status, and unexpected errors are logged once and answered with a
  generic message that never echoes the cause. A handler that _returns_
  `status(4xx, body)` bypasses the boundary; declaring `apiErrorSchema` for
  that status makes a wrong body fail response validation. Proven in
  `apps/api/src/errors.test.ts` for the 404, the unparsable-body 400, the
  response-schema 500, the unexpected-error 500 (cause never echoed) and a
  thrown `status(...)` keeping its status. The 422 `invalid_request` answer
  and the returned-`status` bypass follow from `errors.ts` and Elysia but are
  not yet asserted by any test.
- **Migrations apply exactly once,** each in a transaction with its record:
  a failing migration leaves nothing behind and is not recorded. Proven in
  `apps/api/src/database.test.ts`.
- **Startup fails on invalid configuration** rather than falling back.
  Proven in `apps/api/src/env.test.ts`.

## Boundaries

- **No API runtime in the web bundle.** The only file that may import
  `@kipos/api` is `apps/web/src/api/client.ts` (created with the first API
  call), and with `import type` only. Proven in
  `tooling/checks/structure.test.ts`.
- **Features never import each other**, in either app. Enforced by
  `tooling/oxlint.json`.
- **Every ui primitive is public and every export resolves.** Proven in
  `packages/ui/test/exports.test.ts`.
- **The home page server-renders** with its heading and stylesheet, and ships
  no development tooling. Proven in `apps/web/test/build/home.test.ts`.
