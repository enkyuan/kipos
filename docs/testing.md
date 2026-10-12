# Testing

## Commands

| Command          | What it proves                                                                                                                    | Speed          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `bun run check`  | formatting, lint and import boundaries, types (including the API contract the web client compiles against), unused code           | seconds        |
| `bun run test`   | API route and unit tests (real SQLite), ui exports and token contrast, web SSR against the production build, repository structure | seconds        |
| `bun run build`  | production web build                                                                                                              | seconds        |
| `bun run verify` | all of the above — the CI gate                                                                                                    | under a minute |

Per workspace: `bun run --cwd apps/api test`, `bun test --watch` inside a
workspace for a tight loop, `bun test tooling` for structure checks.

## Where tests live

- `apps/api/src/**/*.test.ts` — beside the code. Exercise features through
  `createApp(deps).handle(request)` with `openDatabase(":memory:")`; assert
  durable state, not only status codes.
- `packages/ui/test/` — the public-export contract, and the color roles'
  WCAG contrast pairs and radius ladder, read from the token sources.
- `apps/web/test/build/` — against `dist/` after `vite build`: what a
  deployment serves.
- `tooling/checks/` — conventions: naming, dependency direction, pinned
  versions, workspace scripts, task-record states.
