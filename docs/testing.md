# Testing

## Commands

| Command          | What it proves                                                                                                          | Speed          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------- |
| `bun run check`  | formatting, lint and import boundaries, types (including the API contract the web client compiles against), unused code | seconds        |
| `bun run test`   | API route and unit tests (real SQLite), ui export contract, web SSR against the production build, repository structure  | seconds        |
| `bun run build`  | production web build                                                                                                    | seconds        |
| `bun run verify` | all of the above — the CI gate                                                                                          | under a minute |

Per workspace: `bun run --cwd apps/api test`, `bun test --watch` inside a
workspace for a tight loop, `bun test tooling` for structure checks.

## Where tests live

- `apps/api/src/**/*.test.ts` — beside the code. Exercise features through
  `createApp(deps).handle(request)` with `openDatabase(":memory:")`; assert
  durable state, not only status codes.
- `packages/ui/test/` — the public-export contract.
- `apps/web/test/build/` — against `dist/` after `vite build`: what a
  deployment serves.
- `tooling/checks/` — conventions: naming, dependency direction, pinned
  versions, workspace scripts, task-record states.

## Manual acceptance

```bash
bun run dev
curl -s localhost:3001/health
curl -si localhost:3000/api/v1/waitlist -H 'content-type: application/json' -d '{"email":"ada@example.com"}'
```

The second request goes through the web dev server's proxy and should answer
`202 {"status":"accepted"}`.
