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
  The toast primitive (`@kipos/ui/toast`, `ToastProvider` in `__root.tsx`)
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

## Follow-up: analysis panel hierarchy

- Question-first, chosen by the person from three mockups. Header: title
  with a compact live status (Updated hh:mm, Analyzing, Waiting for talk,
  Retrying, Off; the dot/spinner blur-swaps with `motion`). Lead: the next
  question as the headline of the brand card ("Ask next", priority), then
  who to ask and the gap, why it matters, evidence, actions. Empty: a
  dashed "Nothing to ask yet" box. Then collapsible rows with counts (Also
  open, Requirements, Resolved and dismissed), closed by default.
- Rows use a new `@kipos/ui/collapsible` (coss collapsible on Base UI): the
  panel animates its height with the strong ease-out, instantly under
  reduced motion; items indent under the row label. A new lead question
  leaves in 120 ms and the next settles in (`motion`, ADR 0005), never on
  first render.
- List issue cards drop the redundant "Open" badge; priority reads "High
  priority".
- The panel "in the main column" seen at 1920 px was a stale dev
  stylesheet (cached modules across branch switches); the layout puts it
  in the right column at `lg` and up. Adding the collapsible also made Vite
  re-optimize deps mid-session (an "Invalid hook call" until reload).
- Verified (gstack headless, 1920×1080, scratch copy of the dev DB with
  seeded gaps and requirements, Vexa and Bedrock unreachable): card at
  x=1192, 384 px wide; row opens 0 → 372 → 577 → 616 px over ~150 ms; no
  console errors.

## Remaining

Adversarial review. Live check of the requested → recording transition in
a real meeting.
