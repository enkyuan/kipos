# Workspace navigation and flow polish

State: REVIEW
Branch: feat/meeting-ingestion
Worktree: primary checkout
Base SHA: 475609f
Head SHA: see branch
Depends on: meeting-workspaces (fast-forwarded into this branch at
475609f), meeting-view-polish and transcript-time-origin (same files;
committed together in 75bab10)

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

- **Router.** Every in-app link is a TanStack `Link` (wordmark, meeting
  tiles, the meeting page's "Meetings" back link, 404's "Back to
  meetings"); plain `<a href>` reloaded the whole document. The meeting
  route keys `MeetingView` by id, so a direct meeting-to-meeting navigation
  starts fresh instead of showing the last meeting until the new one loads.
- **Meeting page header.** A ghost "Meetings" back link (coss back-link
  particle) above a title naming the meeting by when it started (the grid
  names tiles by date). The missing-session state keeps only the message;
  the back link covers the way out.
- **Recording notice removed** (dialog alert and meeting-page toast), at
  the person's request. The consent checkbox stays: the API requires it.
  The toast primitive (`@ouro/ui/toast`, `ToastProvider` in `__root.tsx`)
  now has no caller; kept for now, a deletion candidate.
- **"Requesting notetaker"** shows a spinner inside the badge, like the
  recording dot, and no detail sentence.
- **Motion, as CSS.** New token `motion.easeOut` (strong ease-out) and
  `motion.press` (0.96). Buttons and grid tiles shrink on press (not under
  reduced motion). The dialog enters with `easeOut` and exits in 150 ms
  instead of coss's 200 ms ease-in-out, so a closing backdrop stops eating
  clicks sooner (observed: a tile click right after Escape was swallowed).
- **Copy icon swap uses `motion`** (`AnimatePresence`, blur-fade, spring
  0.3 s, no bounce): ADR 0005. Icon only; no visible label.

## Verification

- [x] `bun run verify` (api 83, ui 2, web build 5, structure 6, plus the
      merged claude-plugin 8 and dial-service 20)
- [x] Browser, dev servers on the real dev DB: tile → meeting, back link →
      grid, wordmark, all same-document (a window marker survives); title
      "Oct 11, 2026, 3:15 PM"; transcript offsets from 0:38.
- [x] Dialog: opens from the plus tile with focus in the link field and
      page scroll locked; empty submit shows both field errors; a Zoom link
      shows the API's 422 at the field.
- [x] Start → meeting page, against a scratch API (scratch DB, Vexa at a
      closed local port, so no notetaker could be sent): navigates
      client-side, dialog unmounted, scroll restored; requested state shows
      the spinner badge on the page and its grid tile.
- [x] Copy icon (gstack headless, visible page; the app's browser pane was
      hidden, where rAF-driven motion never advances): copy and check
      cross-fade over ~150 ms with blur and scale, the leaving icon
      unmounts, it resets after 2 s; no console errors.
- [x] 375 px: dialog is a bottom sheet.
- Dev-only: on a fresh dev server, the first client-side visit to a route
  can render before StyleX's dev CSS includes that route's styles; a reload
  fixes it. Production ships one compiled stylesheet.

## Remaining

Adversarial review. Live check of the requested → recording transition in
a real meeting.
