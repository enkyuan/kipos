# Meeting ingestion (Task 1: real-time meeting shadowing)

State: BLOCKED
Branch: feat/meeting-ingestion
Worktree: primary checkout
Base SHA: 52e8cc3
Head SHA: see branch
Depends on: a Vexa API key and two people in a live Google Meet.

## Goal

An FDE supplies a Google Meet URL, authorizes a notetaker, and sees real,
speaker-attributed transcript lines appear live; state survives refresh.

## Scope

Expected paths: `apps/api/src/meetings/`, `apps/api/src/live-feed.ts`,
`apps/api/migrations/`, `apps/web/src/features/{meetings,workspace}/`,
`apps/web/src/routes/`, `packages/ui/src/primitives/{alert,checkbox}.tsx`, docs.

## Decisions

`docs/decisions/0003-meeting-ingestion.md` (Vexa: stream + REST catch-up +
optional signed webhooks; status derived from all reports). The landing
page, waitlist UI and waitlist API were removed; Agentation was added as a
dev-only annotation toolbar. An adversarial review of the first (Recall)
draft found order-dependent status, a second bot after an ambiguous
request, permanently blocked meeting links, a dead live view after a
proxy error, and unretried deliveries; all are fixed in the Vexa version.

## Verification

- [x] `bun run verify` (api 79, ui 2, web build 5, structure 6)
- [x] Browser (gstack headless, dev servers): validation, 422 for a non-Meet
      link, and a real `POST /bots` to Vexa with a placeholder key shown as a
      failed session ("Vexa rejected the server's API key").
- [ ] Live meeting: bot admitted, ≥ 6 utterances live, refresh persists,
      redelivery not duplicated, denied admission shown as failure.

## Remaining

Blocked on credentials and a live meeting. Next: `docs/testing.md` "Live
acceptance", record results here, move to `completed/` as DONE.

Known limitations: no authentication on `POST /api/meetings` (anyone who
can reach the API can send a bot); single API process.
