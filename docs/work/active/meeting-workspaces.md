# Meeting workspaces home page

State: REVIEW
Branch: feat/meeting-workspaces
Worktree: ../ouro-wt/feat-meeting-workspaces
Base SHA: db4e01b
Head SHA: see branch
Depends on: meeting-ingestion (same base branch)

## Goal

`/` is the first page a person sees: a Figma-style grid of their meetings.
The first tile is a "New meeting" card with a blue plus; it opens a dialog
asking for the Google Meet link and the recording confirmation. Starting
goes to `/meetings/$meetingId` (live transcript and status). Every other
tile is a stored meeting session, titled by its date and labelled with its
Google Meet code.

## Scope

Expected paths: `apps/api/src/meetings/{routes,store,routes.test}.ts`,
`apps/web/src/features/meetings/`, `apps/web/src/routes/index.tsx`,
`apps/web/test/build/workspace.test.ts`,
`packages/ui/src/primitives/dialog.tsx`, `packages/ui/package.json`, docs.
Shared/high-contention paths: `packages/ui/package.json` (the parallel
meeting-view-polish task adds a `toast` export: trivial merge).
Must not modify: migrations, stored data.

## Acceptance

- `GET /api/meetings` lists every session, newest first.
- `/` server-renders the grid heading and the "New meeting" control; the
  list loads in the browser.
- The dialog's form keeps the consent control (its recording notice was
  later removed: `workspace-navigation.md`).
- `bun run verify` passes.

## Decisions

- One tile per session, not per Meet code: a recurring Meet link is reused
  across meetings, and each session has its own transcript. The Meet code
  is derived from the canonical `meetingUrl`, so the contract is unchanged.
- The list is unpaginated until there is a person with enough meetings to
  need it.

## Verification

- [x] targeted tests (`GET /api/meetings`: empty, newest first incl. failed)
- [x] `bun run verify` (api 81, ui 2, web build 5, structure 6)
- [x] Browser (gstack headless, dev servers, scratch DB with 4 seeded
      sessions; not live acceptance): grid at 1280 and 375 wide, dialog
      opens from the tile, a Zoom link shows the 422 message at the field,
      Escape returns focus to the tile, no console errors.

## Remaining

Review, then merge after meeting-view-polish; that task adds the same
`shadow.lg` token and a `toast` export to `packages/ui/package.json`, and
its acceptance line about the start form rendering on `/` moves to the
dialog. Known limitation: the list is unpaginated.
