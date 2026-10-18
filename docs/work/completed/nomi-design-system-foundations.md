# Nomi design system foundations

State: DONE
Branch: feat/nomi-design-system-foundations (stacked on chore/rename-kipos-to-nomi)
Worktree: .claude/worktrees/rename-kipos-to-nomi-22cf6d
Base SHA: 3948888
Head SHA:
Depends on: chore/rename-kipos-to-nomi

## Goal

Rebuild `packages/ui` on Tailwind v4 and CSS variables, the technique of
design.interfere.com (docs/design/nomi-design-system-plan.md, PR B), and remove
StyleX.

## Scope

Expected paths: `packages/ui` (styles, scripts, primitives, tests),
`apps/web` (Vite plugin, app.css, root route, home, page frame, theme
feature), `tooling/` (oxlint, structure tests), `knip.jsonc`, AGENTS files,
`docs/decisions/0008-tailwind-design-system.md`, `docs/design/`.
Shared/high-contention paths: every `package.json`, `bun.lock`,
`tooling/oxlint.json`, AGENTS files.
Must not modify: `feat/notebook-design-system`, `feat/interfere-design-system`.

## Acceptance

- Home and not-found render on roles only, in light, dark and system modes.
- Contrast and token tests pass; the built bundle has no StyleX.
- `bun run verify` passes; no `stylex` or `kipos` string outside history.

## Decisions

See ADR 0008. Deviations from the plan: no `utilities.css` (Tailwind's theme
namespaces generate the helpers) and no separate P3 block (OKLCH).

## Verification

Browser (built app via `vite preview`, light/dark OS emulation): system follows the OS,
Light and Dark pin the class before paint and survive reload, the toggle
shows the saved mode after hydration, not-found renders on roles.

- [x] targeted tests
- [x] bun run verify
- [x] light, dark and system modes in a real browser

## Remaining

PR C (primitives) and PR D (`/design` route).
