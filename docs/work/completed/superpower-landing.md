# Superpower landing page

State: DONE
Branch: feat/superpower-landing
Worktree: primary checkout
Base SHA: 52e8cc3
Head SHA: 29a8db8
Depends on: none

## Goal

Implement the "Superpower Landing v3" design (claude.ai/design project
"Landing page design brief", file `Superpower Landing v3.dc.html`) as a
standalone static page, separate from `apps/web`, on its own branch.

## Behavior

`apps/superpower-landing/index.html` is a single self-contained static page
reproducing the v3 design: nav pill, hero with animated terminal and
four-step card carousel, statement figures, scroll-driven "how it works",
surfaces switcher, dark control band, CTA, footer. No build step, no
dependencies.

## Decisions

- Placed in `apps/` as a deployable, but without a `package.json`: it is a
  static artifact, not a bun workspace, so it stays out of the
  `--filter '@kipos/*'` fan-out and the workspace structure checks.
- The dc-runtime React logic was ported to vanilla JS (same tick/step model,
  same timings) instead of adding React as a dependency.
- Added `prefers-reduced-motion` handling and responsive fixes the source
  design lacked: nav links collapse under 860px, step rails go two-column
  and the footer grid stacks under 720px, and the install-command pill
  ellipsizes instead of overflowing small viewports.

## Verification

- Rendered with headless Chromium at 375px, 768px, and 1280px (full page)
  and visually checked against the design; mobile overflow bugs found this
  way were fixed before commit.
- `bun run verify` was not run locally: bun is not installed on this
  machine. The change adds no workspace code, so the gate's inputs are
  unchanged from `main`. CI runs on pull requests, so it will provide
  evidence when a PR is opened.

## Known limitations

- Fonts load from Google Fonts at runtime; offline viewing falls back to
  system fonts.
- Links (Docs, Terms, social) are placeholders, as in the design.
