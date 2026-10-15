# AGENTS.md

## Purpose

Kipos is a Grok bot for students, in early development: a Bun + Elysia API
and a TanStack Start web app. Nothing of the product is built yet beyond the
shell; `docs/product.md` records what exists.

This repository is set up for iteration at high speed: small vertical slices,
fast local feedback, and a gate that catches drift mechanically so review can
focus on judgment. Speed comes from a short loop, not from skipping it.

The repository is the source of truth. Important behavior, invariants,
decisions, task state, and verification evidence must exist in code, tests, or
`docs/` — never only in conversation or model memory.

Scoped instructions extend this file and never override it:

```text
apps/api/AGENTS.md      backend delta (Elysia, persistence, HTTP contract)
apps/AGENTS.md          frontend delta (apps/web)
packages/ui/AGENTS.md   design-system delta (coss/ui on StyleX)
```

## Engineering standard

Optimize in this order:

1. correctness
2. simplicity
3. explicit failure behavior
4. readability
5. maintainability
6. performance
7. extensibility

Prefer platform primitives (Bun, Web APIs, SQLite, Base UI) over frameworks and
speculative abstractions. Do not optimize for hypothetical scale or
integrations. Prefer deletion over compatibility machinery when no user needs
it.

A strong change is easy to locate, explain, test, and delete.

## Repository shape

```text
.
├── AGENTS.md
├── apps/
│   ├── AGENTS.md            # frontend delta
│   ├── api/                 # @kipos/api — Bun + Elysia HTTP API
│   │   ├── AGENTS.md
│   │   ├── migrations/      # SQLite migrations, applied in filename order
│   │   └── src/
│   │       ├── server.ts    # process composition: env, resources, listen
│   │       ├── app.ts       # createApp(): the HTTP surface; exports `App`
│   │       ├── health/      # liveness route
│   │       ├── <feature>/   # one folder per product concept (routes, store)
│   │       └── *.ts         # cross-feature primitives (env, database, errors)
│   └── web/                 # @kipos/web — TanStack Start + React + StyleX
│       ├── src/
│       │   ├── routes/      # URL topology (file-based)
│       │   └── features/    # product concepts (page-frame)
│       └── test/            # tests against the production build
├── packages/
│   ├── ui/                  # @kipos/ui — coss/ui primitives on StyleX
│   └── tsconfig/            # shared compiler options
├── docs/
│   ├── product.md           # what / who / non-goals
│   ├── architecture.md      # components, boundaries, request flow
│   ├── invariants.md        # truths implementations must preserve
│   ├── testing.md           # canonical commands and gates
│   ├── decisions/           # ADRs: durable design decisions
│   ├── playbooks/           # recurring procedures (adding a feature, ...)
│   └── work/                # task state: active/, completed/, handoffs/
├── tooling/
│   ├── oxlint.json          # lint rules, structural limits, import boundaries
│   └── checks/              # repository structure tests (bun test tooling)
└── .github/workflows/ci.yml
```

Do not add a top-level directory unless the responsibility cannot fit an
existing one. A new deployable goes in `apps/`; a new shared library in
`packages/`, and only once two apps need it.

## Ownership and dependency direction

Organize code by owned product concept, not by technical layer. There is no
`services/`, `controllers/`, `models/`, `utils/`, `helpers/`, `common/`, or
`shared/`. If code has no obvious owner, decide the owner before adding it.

```text
apps/web ──types only──▶ apps/api
   │                        │
   ▼                        ▼
packages/ui            bun:sqlite, elysia
   │
   ▼
@base-ui/react, @stylexjs/stylex
```

Rules (enforced by `tooling/oxlint.json` and `tooling/checks/`):

- `packages/ui` never imports an app, a router, or a server framework.
- `apps/api` never imports `@kipos/ui`, `@kipos/web`, or React.
- `apps/web` imports `@kipos/api` with `import type` only, and only in
  `src/api/client.ts` (created with the first API call); it never imports
  API source or Bun built-ins.
- Feature folders never import each other, in either app.
- `apps/web` consumes `@kipos/ui` through its package exports only.
- Components read semantic tokens (`@kipos/ui/tokens.stylex`), never palette
  shades.
- Circular imports are forbidden.

## Code shape

Prefer small pure functions, narrow interfaces defined by their consumer,
explicit inputs and outputs, dependency injection at stable boundaries, one
obvious execution path, and boring control flow.

Avoid hidden global state, generic framework layers, speculative abstractions,
duplicate execution paths, boolean parameter piles, vague
`Manager`/`Service`/`Engine`/`Handler` types, and wrappers that only rename
another API.

Limits (oxlint): 300 lines per file, 80 per function, complexity 12, depth 4,
3 parameters. They are architecture alarms: a violation means reconsider
ownership, not split mechanically.

### Abstraction test

Before adding a type, interface, directory, dependency, or datastore, answer:

- What concrete problem does it solve now?
- What invariant does it own?
- Why can an existing primitive not express it?
- What becomes simpler because it exists?
- How will its contract be tested?

Every public abstraction must be explainable in two or three plain sentences.
If the answers are weak, do not add it.

## Naming

Names are architecture. Files name the owned concept (`routes.ts`, `store.ts`,
`app.ts`, `page-frame.tsx`); functions read as actions
(`createApp`, `openDatabase`, `readEnv`); types name domain concepts
(`Env`, `ApiError`), not implementation accidents.

Filenames are kebab-case. Tests sit beside the code they prove
(`routes.test.ts`), except `apps/web/test/`, which runs against the build.

## Comments

Names and structure explain **what**. Comments explain **why**: a safety
invariant, a failure-mode decision, a platform limitation, or why a
simpler-looking implementation would be wrong.

Do not narrate syntax. Do not leave history that belongs in an ADR or a task
record.

## Iteration loop

```bash
bun install
bun run dev            # api on :3001 (watch; apps/api/.env is optional), web on :3000 (HMR)
bun run check          # format, lint, typecheck, knip — seconds
bun run test           # unit, route, SSR-build, and structure tests
bun run verify         # check + test + build: the full gate CI runs
```

Work in the smallest vertical slice that a person could use or a test could
prove: an endpoint plus its test, a section plus its build assertion. Run
`bun run check` continuously; run `bun run verify` before handing off.

Once `apps/web` has its Eden client (added with the first API call), it
type-checks against `App` from `apps/api`, so an API contract change breaks
`bun run typecheck` at every call site. Let the type error be the to-do list.

## Stateful task records

Nontrivial work gets a task file before implementation, from the template in
`docs/work/README.md`:

```text
docs/work/active/<task>.md
```

Lifecycle:

```text
SCOPED → IMPLEMENTING → REVIEW → VERIFY → DONE
                                   └──→ IMPLEMENTING
any active state → BLOCKED (record the dependency and next safe action)
```

When finished, move it to `docs/work/completed/` with the final SHA, the
behavior, important decisions, verification, and known limitations. Promote
any lasting rule to canonical docs first. Trivial changes (a typo, a copy
tweak, a version bump) need no record.

## Branches, worktrees, and parallelism

Every nontrivial task gets one branch: `<type>/<short-kebab-description>`,
where type is one of `feat fix refactor chore docs test perf ci build`. One
concern per branch; no agent, model, or person names.

Keep the primary checkout clean on `main`. Concurrent tasks get isolated
worktrees outside it:

```bash
git worktree add ../kipos-wt/feat-study-sessions -b feat/study-sessions origin/main
```

One owner controls one worktree at a time. Plan parallel work around conflict
surfaces; two active tasks must not edit the same file or semantic surface.
High-contention surfaces, owned by one task at a time:

```text
package.json files and bun.lock
apps/api/src/app.ts (feature registration)
apps/api/migrations/ (ordering)
packages/ui/src/tokens/
AGENTS.md files, docs/architecture.md, docs/invariants.md
tooling/oxlint.json
```

If two tasks need the same foundational change, merge it first, then rebase
dependents. Before final `VERIFY`, rebase on the latest `origin/main` and rerun
the full gate on the rebased head; CI on a pre-rebase SHA does not count.
Remove the worktree and branch after merge.

## Handoffs

When ownership or session continuity changes, write
`docs/work/handoffs/<task>.md` with: State, Branch, Worktree, Base SHA, Head
SHA, Goal, Decisions, Changed, Verification, Remaining, Next. A handoff is
stale when its Head SHA no longer matches the branch. Handoffs carry
conclusions and evidence, not reasoning transcripts.

## Roles

Roles are agent-agnostic; humans or tools may fill them.

- **Design authority** owns scope, boundaries, invariants, API shape, failure
  semantics, and acceptance criteria.
- **Implementer** owns one bounded change in one worktree, tests it, and keeps
  its task record current.
- **Adversarial reviewer** receives the contract and diff, not the
  implementer's reasoning, and looks for correctness failures, partial side
  effects, API leakage, unnecessary abstraction, and code to delete. Material
  design changes return the task to `SCOPED`.
- **Mechanical contributor** handles fixtures, formatting, docs sync, and
  scaffolding under the same gate.
- **Integrator** sequences shared files, verifies final SHAs, runs the gate,
  merges, and cleans up worktrees.

No one self-approves a material change.

## Work protocol

Before changing code:

1. read this file and the scoped AGENTS.md for the paths you will touch
2. read the relevant canonical docs
3. inspect the implementation and its tests
4. check `docs/work/active/` for overlapping tasks
5. define the smallest useful change and its acceptance condition

Then:

```text
scope → implement → targeted tests → simplify → review → verify → merge → record
```

If a task spreads across unrelated features or high-contention files, stop and
re-scope.

### Simplification pass

After a change works, review it once with the sole aim of reducing it: can a
type, branch, file, prop, or dependency disappear? Is an abstraction used only
once? Is there more than one way to do the same thing? Did a public API grow
without need? Behavior must not change during this pass.

## Testing

Tests describe guarantees, not implementation details:
`answers an unknown route with the typed 404`, not `calls the error handler`.

- API features test through `createApp(...).handle(request)` with a real
  SQLite database (`openDatabase(":memory:")`), asserting durable state as well
  as the response.
- Web tests run against the production build (`dist/`), the artifact a
  deployment serves.
- Every important failure state gets a test.

Canonical commands live in `docs/testing.md` and CI.

## CI contract

CI (`.github/workflows/ci.yml`) runs `bun run verify` on a frozen lockfile:

```text
oxfmt check · oxlint (structure + boundaries) · tsc per workspace · knip
bun test per workspace · SSR build smoke tests · structure checks · build
```

CI is evidence only for the exact commit it ran against.

## Documentation

```text
docs/product.md        what / who / non-goals
docs/architecture.md   components, boundaries, request flow
docs/invariants.md     truths implementations must preserve
docs/testing.md        canonical verification
docs/decisions/        why durable choices were made
docs/playbooks/        how recurring work is done
docs/work/             what is being done, or was done
```

Canonical docs answer "what is true now"; `docs/work` answers "what is being
done". Update canonical docs only when durable behavior changes, in the same
change. Do not turn documentation into a chronological log.

## Definition of done

A change is done when:

- the smallest correct design is implemented
- names and files communicate ownership and intent
- failure behavior is explicit and tested
- `bun run verify` passes on the final, rebased head
- contracts (API types, ui exports) and canonical docs are synchronized
- unnecessary code has been removed
- the task record states what was done and how it was verified
- no important decision exists only in agent context
- another engineer can continue from the repository alone

The desired end state is not "agent-generated code". It is ordinary,
high-quality engineering that happens to be produced quickly.
