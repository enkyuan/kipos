# Transcript times from the session start

State: REVIEW
Branch: feat/meeting-ingestion
Worktree: primary checkout
Base SHA: db4e01b
Head SHA: see branch
Depends on: meeting-view-polish (same branch; uncommitted edits to the same
`apps/api/src/meetings/` files, so this task works on top of them in place)

## Goal

Utterance `startTime`/`endTime` mean what the contract says: seconds from the
start of the recording. A real Vexa meeting stored Unix epoch seconds
(`1791756943.326`), so the transcript and evidence links rendered
"29862615:43".

## Scope

Expected paths: `apps/api/src/meetings/{vexa-events,vexa-stream,fixtures,contract}.ts`,
`apps/api/src/meetings/ingest.test.ts`, `docs/invariants.md`.
Shared/high-contention paths: none.
Must not modify: migrations, `apps/web` (display stays as is).

## Acceptance

- An epoch-valued segment is stored as seconds from the session's start, on
  the live stream and the REST catch-up alike.
- Segments already timed in offsets are stored as given.
- Ordering (`ORDER BY start_time, id`) and dedup are unaffected.
- Regression test in `ingest.test.ts`.

## Decisions

- **Normalize at ingestion, not at display.** The stored value is the
  contract; analysis prompts (`analysis/prompt.ts`) and the web both read it,
  so fixing it once where provider payloads are parsed keeps every consumer
  correct. `vexa-events.ts` owns provider quirks already.
- **Origin is the session's `startedAt`.** It is known before any segment
  arrives, never changes, and is the same for both delivery paths, so one
  segment gets one time however it arrives (fallback dedup keys stay stable,
  order is consistent). Alternatives rejected: the first `active` report
  (can arrive after the first segment, so times would depend on delivery
  order); the REST record's `start_time` (absent from live frames). Cost: the
  first line reads the join delay (~30–40 s in the real meeting), not 0:00.
- **Epoch detection by magnitude.** A value ≥ 1e9 s (September 2001) is a
  wall-clock time; no meeting offset reaches 31 years. Values below are
  taken as offsets, as before.
- **No migration.** No user has data; the only epoch rows are in the local
  dev database. Prefer deletion over compatibility machinery: reset
  `apps/api/data/ouro.sqlite`, or fix the rows once by hand:

  ```sql
  UPDATE transcript_utterances AS u
  SET start_time = round(start_time - unixepoch(s.started_at, 'subsec'), 3),
      end_time   = round(end_time   - unixepoch(s.started_at, 'subsec'), 3)
  FROM meeting_sessions AS s
  WHERE s.id = u.meeting_session_id AND u.start_time >= 1e9;
  ```

## Verification

- [x] targeted tests: `ingest.test.ts` "times epoch-stamped segments from
      the session's start, on every path" (live frame then REST record,
      out of order, one segment on both paths). Fails without the fix
      (`startTime: 1791757976.92`), passes with it. Existing offset-valued
      tests (`startTime: 1.2`) unchanged: offsets are stored as given.
- [x] bun run verify (api 81, ui 2, web build 5, structure 6)
- [ ] Live meeting: first line reads ~0:30–0:40, not "29862615:43".

## Changed

- `vexa-events.ts`: `Reading` (`receivedAt`, `startedAt`) is what both
  readers take; `fromStart` converts epoch times. `notBefore` is now
  `startedAt`: one name for the one origin.
- `vexa-stream.ts`: reads the session's `startedAt` per frame (a vanished
  session stops the watcher, as `finished()` already did).
- `fixtures.ts`: the stream helper passes the session's `startedAt`.
- `contract.ts`, `docs/invariants.md`: the origin is stated.

## Remaining

Adversarial review; live-meeting check.

Known limitation: if Vexa ever sends offsets from its own bot start on one
path and epoch times on the other for the same meeting, the two differ by
the join delay. Every segment seen so far carries a segment id, so dedup
holds; only the relative order of such mixed lines could be off.
