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

## Live acceptance

Automated tests stand in for Vexa and the model; only a real meeting
proves the pipeline. No seeded, inserted or hardcoded transcript counts.

### Setup (once)

1. **Vexa key.** Sign in at https://vexa.ai/signin (Google account) and copy
   the API key from https://vexa.ai/account (free credit, no card), or
   self-host and point `VEXA_API_URL` at the gateway.
2. **Model key** (for analysis): an Anthropic API key.
3. `cp apps/api/.env.example apps/api/.env`; set `VEXA_API_KEY` and
   `ANTHROPIC_API_KEY`.
4. Optional signed webhooks: `cloudflared tunnel --url http://localhost:3001`,
   set `VEXA_WEBHOOK_SECRET`, and register the URL with `PUT /user/webhook`
   (command in `.env.example`).
5. `bun run dev` (or `WEB_PORT=3100 bun run dev` if :3000 is busy).

### Meeting shadowing (Task 1)

1. Two consenting people join a new Google Meet. Paste its link, tick the
   consent box, choose Start shadowing.
2. The page moves to "Waiting to be admitted"; the host admits "Ouro
   notetaker"; "Listening" appears only once Vexa reports `active`.
3. Speak at least six unscripted sentences across both people; lines
   appear with speaker names as each segment is confirmed.
4. Refresh: the transcript is still there and no second bot joins.
5. Duplicates: restart the API mid-meeting (the stream reconnects and the
   catch-up re-reads every segment), then confirm no line is stored twice:
   `sqlite3 apps/api/data/ouro.sqlite "SELECT dedup_key, COUNT(*) FROM transcript_utterances GROUP BY 1 HAVING COUNT(*) > 1"`
   returns nothing.
6. Failures: start with an invalid link (inline error, no bot); start
   another session and deny the bot in the waiting room ("Failed: The host
   declined to admit the notetaker.").

### Requirements and gaps (Task 2)

In a new meeting, have an unscripted conversation about a real or
plausible process. Without scripting exact words:

1. State a business requirement explicitly; it appears under Requirements
   (Proposed), with "Said in" links to the line.
2. Leave an implementation-critical detail open (a limit, an exception
   path, an integration's access); an issue appears with why it matters, a
   question, and "Raised by" links that highlight the transcript line.
3. Mention the same gap again later: the same card updates (no duplicate).
4. Answer it later in the conversation: the card moves to Resolved, with
   "Answered by" links and the original evidence kept.
5. Dismiss a different gap, mention it again without new information: it
   stays dismissed.
6. Refresh: requirements, issues, saved and dismissed states are unchanged.
7. In a short exchange with nothing implementation-relevant (small talk),
   no issue appears.
