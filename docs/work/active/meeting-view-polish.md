# Meeting view polish (live drafts, sidebar card, copyable link, notice toast)

State: REVIEW
Branch: feat/meeting-ingestion
Worktree: primary checkout
Base SHA: db4e01b
Head SHA: see branch
Depends on: meeting-ingestion, requirement-analysis (same branch)

## Goal

From annotated feedback on `/meetings/$meetingId`:

1. The transcript streams in real time: words appear while a person speaks,
   not only once Vexa confirms the segment.
2. The header loses the "FDE workspace" label.
3. The analysis panel becomes one card in the right sidebar with a clear
   hierarchy (state → ask next → also open → requirements → closed).
4. The meeting link is a read-only field with a copy button.
5. The recording notice on the meeting page is a toast, not an inline alert,
   three lines of text.
6. The loading state shows a spinner beside centered text (coss Spinner
   ported to `@ouro/ui/spinner`, decorative; the `<output>` beside it
   carries the status).

## Scope

Expected paths: `apps/api/src/meetings/{vexa-events,ingest,contract}.ts`
and tests, `apps/api/src/app.ts` (type export only),
`apps/web/src/features/{meetings,analysis,workspace}/`,
`apps/web/src/routes/__root.tsx`, `apps/web/src/api/client.ts`,
`packages/ui/src/primitives/{toast,input-group,input,button}.tsx`,
`packages/ui/src/tokens/base.css`, `packages/ui/package.json`, docs.
Must not modify: stored data, migrations.

## Acceptance

- Drafts reach the browser as a `draft` live event and are never stored or
  replayed; a confirmed line replaces its speaker's draft.
- The start form still server-renders its recording notice and consent
  control (`workspace.test.ts`).
- `bun run verify` passes.

## Decisions

- Drafts are shown, not stored: invariant "Only finalized speech" still
  holds for storage and analysis. A draft is one speaker's latest
  hypothesis; Vexa's `transcript` frame is a per-speaker bundle, so each
  replaces only that speaker's draft, and an empty `pending` clears it.
- Read-only rather than disabled input: a disabled field can't be focused or
  selected, so it could not be copied by hand.
- The notice toast stays until dismissed (it asks the person to tell
  everyone), and only while the notetaker can still be in the meeting. A
  new toast per mount: re-adding a fixed id while it is closing leaves it
  stuck off-screen (seen under dev remounts).
- coss Toast ported with its stacking geometry in `base.css` (Base UI's
  CSS-variable arithmetic under compound state selectors); surface styles
  in StyleX. InputGroup ported with inline addons only, without coss's
  click-addon-to-focus handler. Button gains coss's `xs` and `icon-xs`.
- The transcript follows the live edge only for a reader already at the
  bottom (ResizeObserver on the transcript), with instant scrolls.

## Verification

- [x] targeted tests: `ingest.test.ts` "publishes each speaker's words in
      progress live, without storing them"
- [x] bun run verify (api 80, ui 2, web build 5, structure 6)
- [x] Browser, dev servers, 1440×900 and 375×812, on a real (ended)
      meeting: no "FDE workspace"; sidebar card hierarchy; link field
      copies (stubbed clipboard: check icon, "Link copied", resets after
      2 s) and falls back to selecting the link when clipboard access is
      refused; toast collapsed stack, hover-expand, 14px title; no notice
      toast once the session ended. Loading state (preview build against a
      stalled API): spinner and text centered. Notice description wraps to
      3 lines at the toast's text width.
- [ ] Live drafts in a running meeting (the test meeting ended before the
      check): words appear under "speaking" and are replaced by the
      confirmed line.

## Remaining

Live-meeting check of drafts and of the notice toast while recording;
adversarial review. Found in passing (separate task): stored utterance
times are Vexa epoch seconds, so offsets render as "29862615:43".
→ `transcript-time-origin.md`.
