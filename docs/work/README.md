# Work records

`docs/work` answers "what is being done, or was done". Canonical docs answer
"what is true now". See `AGENTS.md` "Stateful task records".

```text
active/      one file per task in flight
completed/   finished tasks (State: DONE), with final SHA and verification
handoffs/    ownership transfers between sessions or people
```

`tooling/checks/structure.test.ts` rejects a record without a valid `State:`.

## Template

```md
# <Task>

State: SCOPED
Branch:
Worktree:
Base SHA:
Head SHA:
Depends on: none

## Goal

## Scope

Expected paths:
Shared/high-contention paths:
Must not modify:

## Acceptance

## Decisions

## Verification

- [ ] targeted tests
- [ ] bun run verify

## Remaining
```
