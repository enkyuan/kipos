# Nomi core primitives

State: DONE
Branch: feat/nomi-primitives-core (stacked on feat/nomi-design-system-foundations)
Worktree: .claude/worktrees/rename-kipos-to-nomi-22cf6d
Base SHA: a4ff34c
Head SHA:
Depends on: feat/nomi-design-system-foundations

## Goal

PR C of docs/design/nomi-design-system-plan.md: the primitives a
student-facing app needs first, on the foundations from ADR 0008.

## Scope

Input, Textarea, Label, Checkbox, Switch, Radio Group, Card, Badge, Divider,
Spinner, Skeleton, Tooltip, Dialog, Toast, Tabs, each with `data-slot` parts,
`nm-*` classes in `packages/ui/src/styles/components/`, and tests.
Must not modify: foundations (scales, roles) beyond one added role.

## Acceptance

- Each primitive: slots and variants asserted, keyboard and focus behavior
  tested where interactive, text roles contrast-checked.
- `bun run verify` passes.

## Decisions

- One CSS file per family (button, form, surface, overlay), not per component.
- Added the `backdrop` role (dialog scrim); the plan did not list one.
- Behavior tests use happy-dom (`@happy-dom/global-registrator`, preloaded by
  `packages/ui/bunfig.toml`). Base UI works under it for these cases.
- Demos are deferred to the `/design` route (PR D); a throwaway page was used
  to check every primitive in light and dark in a browser, and not committed.
- Dialog root/trigger/close and the toast hook re-export Base UI's own.

## Verification

- [x] targeted tests
- [x] bun run verify
- [x] browser check of all primitives (dark, light, dialog open and Escape,
      toast)

## Remaining

PR D (`/design` route with live demos).
