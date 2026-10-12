# Notebook design system in packages/ui

State: REVIEW
Branch: feat/notebook-design-system
Worktree: ../ouro-wt/feat-notebook-design-system
Base SHA: 0936774 (chore/scaffold-reset)
Head SHA: see branch
Depends on: scaffold-reset (chore/scaffold-reset, must merge first)

## Goal

Retheme `@ouro/ui` with the Living Notebook design system: a 60 / 30 / 10
split of paper, graphite and colour in OKLCH; Zodiak for headings with Glide
for UI; a concentric radius ladder; pill buttons with press feedback and the
notebook's motion values.

## Scope

Expected paths: `packages/ui/src/tokens/*`, `packages/ui/src/primitives/button.tsx`,
`packages/ui/package.json`, `packages/ui/AGENTS.md`, `packages/ui/test/tokens.test.ts`,
`apps/web/test/build/shell.test.ts`, `apps/AGENTS.md`, `bun.lock`, `knip.jsonc`,
`.gitignore`, `README.md`, `docs/decisions/0008-notebook-design-system.md`,
`docs/decisions/0002-*`, `docs/decisions/0007-*`, `docs/architecture.md`.
Shared/high-contention paths: `packages/ui/src/tokens/`, `bun.lock`,
`packages/ui/AGENTS.md`, `docs/architecture.md`.
Must not modify: `apps/api`.

## Acceptance

- Token roles keep their names; values come from the notebook palette and
  every text role meets WCAG AA on the surfaces its comment names, in both
  themes.
- Headings render in Zodiak where the unmodified Fontshare file is present
  (gitignored: the repository is public and the FFL forbids redistribution),
  and in Iowan Old Style/Georgia elsewhere; EB Garamond and its dependency
  are gone (build test).
- `bun run verify` passes.

## Decisions

`docs/decisions/0008-notebook-design-system.md`.

## Verification

- [x] targeted tests: `packages/ui/test/tokens.test.ts` checks every
      documented contrast pair in both themes (text 4.5:1; focus ring and
      control outlines 3:1) and the radius ladder's insets;
      `apps/web/test/build/shell.test.ts` checks the compiled stylesheet and
      rendered kit (no EB Garamond, fine-pointer-only hover, declared font
      faces, base-layer colors equal tokens, pill buttons, page-colored focus
      offset, weighted and tightened headings).
- [x] `bun run verify` passes on the working tree (base 0936774).
- [x] Kit page in the dev server, light and dark: headings render in
      Zodiak 500, the default button is a peach pill with dark text, the
      keyboard focus ring is terracotta with a white gap, the page is white
      (light) and warm near-black (dark).
- [ ] Rebase on `origin/main` once `chore/scaffold-reset` merges, and rerun
      the gate on the rebased head.

## Known limitations

- Zodiak is not in git. CI and fresh clones render the fallback serif and
  request `/fonts/zodiak-variable.woff2` on each load (answered by the 404
  page). A deploy needs a private step that places the Fontshare file before
  building and fails without it; none exists yet.

- Motion values for select, unfold and fold live in 0008 until a primitive
  needs them.
- The kit's avatar entrance starts at scale 0.6 (`apps/web`); the design
  system's floor is 0.9. Left for the kit's owner.
