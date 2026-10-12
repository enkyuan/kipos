# Scaffold reset and Base UI design kit

State: DONE
Branch: chore/scaffold-reset
Worktree: ../ouro-wt/chore-scaffold-reset
Base SHA: 7791008
Head SHA: uncommitted
Depends on: none

## Goal

Clear the project to its base scaffold, replace coss/ui with Base UI
primitives on the existing StyleX tokens, swap Inter for Glide, and add
design libraries for a faster design loop.

## Behavior

- Removed: meeting ingestion and requirement analysis (API, web, migrations,
  ADRs 0003/0004/0006, active task records), `apps/claude-plugin`,
  `apps/dial-service`, `apps/superpower-landing`, every coss primitive.
- API: `/health`, error boundary, env (`PORT`, `DATABASE_PATH`), database
  with an empty `migrations/`.
- Web: root shell, design-kit home page, dev tools (Agentation + DialKit).
- UI: tokens and palette unchanged; Button on Base UI's `Button`; Glide and
  Glide Mono in `src/fonts/`.
- Added: `blode-icons-react`, `blobatar` + `@blobatar/react`, `dialkit`
  (Motion was already present).

## Decisions

`docs/decisions/0007-base-ui-design-kit.md`; 0002 amended for Glide.

## Verification

- `bun run verify` passes.
- Dev server: home page server-renders without errors; Glide, Glide Mono and
  EB Garamond load; Shuffle animates avatars; DialKit panel shows the Kit
  controls; checked in light and dark.

## Known limitations

- `useDialKit` keeps DialKit's store in the production bundle.
