# Requirement analysis (Task 2: live requirement extraction and gap detection)

State: BLOCKED
Branch: feat/meeting-ingestion
Worktree: primary checkout
Base SHA: 52e8cc3
Head SHA: see branch
Depends on: meeting-ingestion; an Anthropic API key; a live meeting.

## Goal

From real transcript utterances, keep business requirements, gaps,
conflicts, and suggested questions current, privately for the FDE.

## Scope

Expected paths: `apps/api/src/analysis/`, `apps/api/migrations/20261011030000_requirement_analysis.sql`,
`apps/web/src/features/analysis/`, the meeting route, docs.
Must not: research, outreach, summaries, messages to participants.

## Decisions

`docs/decisions/0004-requirement-analysis.md`: ~25 s batches past a
per-meeting cursor, one cycle per meeting at a time; forced tool output
validated by TypeBox; `planChanges` enforces evidence, dedupe, resolution,
dismissal and confirmation rules.

## Verification

- [x] `bun run verify` (planner, scheduler, routes, analyzer request tests; api 79)
- [x] Adversarial review: 8 findings (dismissal race, failed-session revival,
      endless watcher, earlier-meeting catch-up, outage skipping batches,
      reconnect storm, webhook mis-match, unlabeled derived data), all fixed
      with regression tests.
- [x] Layout check with sample rows in a scratch database (not acceptance
      evidence): panel, "Ask next", evidence links highlight the transcript
      line, save and dismiss persist across refresh.
- [ ] Live meeting acceptance criteria 1–9 (`docs/testing.md`).

## Remaining

Blocked on keys and a live meeting.

Known limitations: word-similarity dedupe can miss paraphrases with little
word overlap; requirements can't be confirmed by the FDE from the UI (only
by a participant's statement); analysis state ("analyzing") is in memory.
