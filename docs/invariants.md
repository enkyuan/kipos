# Invariants

Truths every change must preserve. Each names the test that proves it.

## Meeting ingestion

Proven in `apps/api/src/meetings/*.test.ts` unless noted.

- **Nothing starts without authorization.** `POST /api/meetings` without
  `authorized: true`, or with a link that is not a Google Meet meeting,
  answers 422 and sends no bot. The bot still needs the host to admit it.
- **One notetaker per meeting.** While a session for a meeting is live, a
  repeated start returns it instead of sending another bot, including when
  the provider's answer was unconfirmed. Only a session silent for two
  minutes (never heard from) or six hours is replaced. The session id is in
  the page URL, so a refresh never starts anything.
- **Only verified webhooks count.** A webhook whose signature does not
  verify over the raw body, or whose timestamp is more than five minutes
  off, is rejected (401) and stores nothing.
- **No duplicate utterances.** A segment delivered again by any path is
  stored once (`UNIQUE (meeting_session_id, dedup_key)`, Vexa's segment id).
- **Spoken order.** The transcript is ordered by start offset, whatever
  order segments arrived in; the live view merges by id and sorts the same way.
  Offsets are seconds from the session's `startedAt`, on every delivery path:
  provider wall-clock (epoch) times are converted at ingestion
  (`ingest.test.ts`).
- **Only finalized speech is stored.** Drafts (`pending`, `completed: false`)
  are never stored, analyzed or replayed; they reach open live channels as
  `draft` events, one per speaker, and a confirmed line replaces its
  speaker's draft (`ingest.test.ts`).
- **Unknown speakers stay unknown.** Unattributed speech is stored with a
  null speaker and shown as "Unknown speaker".
- **Status reflects the provider, in any delivery order.** The status is
  derived from every report; "Listening" only from Vexa's `active`. A
  refused admission, a fatal bot error and other failures show with a
  readable reason.
- **Keys stay server-side.** Provider keys are read only by
  `apps/api/src/server.ts` and never appear in a response or the web bundle
  (`vexa-client.test.ts`).

## Requirement analysis

Proven in `apps/api/src/analysis/*.test.ts`.

- **Every record rests on real evidence.** A requirement or issue citing an
  utterance id that is not in this meeting's transcript is rejected.
- **No duplicate cards.** A repeated issue updates the original (by `ref`,
  or same type and similar wording).
- **Resolution keeps history.** A resolved issue keeps its original
  evidence and adds the answering utterances; an already-answered question
  never becomes an issue.
- **Dismissal sticks.** A dismissed issue comes back only with evidence
  newer than its dismissal.
- **No silent confirmation.** A requirement is `confirmed` only with a
  participant's explicit confirmation cited.
- **Bad output fabricates nothing.** Invalid model output or a model error
  writes nothing, leaves the transcript intact, and the next cycle runs.
- **Incremental and exclusive.** Each utterance is analyzed once (the
  cursor); one cycle per meeting at a time; never per sentence.
- **The transcript is data.** Lines are quoted as JSON and cannot form a
  section of the prompt; the model is offered no acting tool.

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
  imports `@kipos/api`, and with `import type` only. Proven in
  `tooling/checks/structure.test.ts`.
- **Features never import each other**, in either app. Enforced by
  `tooling/oxlint.json`.
- **Every ui primitive is public and every export resolves.** Proven in
  `packages/ui/test/exports.test.ts`.
- **The workspace server-renders** with its meetings grid, "New meeting"
  control and stylesheet, and ships no development tooling. Proven in
  `apps/web/test/build/workspace.test.ts`.
