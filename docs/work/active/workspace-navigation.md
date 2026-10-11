# Workspace navigation and flow polish

State: IMPLEMENTING
Branch: feat/meeting-ingestion
Worktree: primary checkout
Base SHA: 475609f
Head SHA: see branch
Depends on: meeting-workspaces (fast-forwarded into this branch at
475609f), meeting-view-polish and transcript-time-origin (uncommitted in
this checkout; same files, so this task works on top of them in place)

## Goal

The whole path works as one app: `/` (meetings grid) → "New meeting"
dialog → `/meetings/$meetingId` (status, transcript, analysis) → back to
`/`, with client-side navigation and interaction details that feel right.

## Scope

Expected paths: `apps/web/src/routes/`, `apps/web/src/features/{meetings,workspace}/`,
`packages/ui/src/primitives/{dialog,button}.tsx`,
`packages/ui/src/tokens/tokens.stylex.ts` (one motion token),
`apps/web/test/build/workspace.test.ts`.
Shared/high-contention paths: `packages/ui/src/tokens/` (also touched,
uncommitted, by meeting-view-polish).
Must not modify: API, migrations.

## Acceptance

- Every in-app link navigates client-side (no document reload): wordmark,
  meeting tiles, "back to meetings" from a meeting and from 404.
- A meeting page says which meeting it is and links back to `/`.
- Switching straight from one meeting to another never shows the previous
  meeting's state.
- The dialog opens from the plus tile, validates at the field, and a start
  lands on the meeting page with scrolling restored.
- `bun run verify` passes.

## Decisions

## Verification

- [ ] targeted tests
- [ ] bun run verify
- [ ] browser walk-through

## Remaining
