# Nomi design system: decision and plan

Inputs: [`interfere-design-system-map.md`](interfere-design-system-map.md) and [`interfere-tokens.json`](interfere-tokens.json) (the live site), ADR 0007 and the `feat/interfere-design-system` branch (the first adoption, on StyleX), and the stripped shell in PR [enkyuan/kipos#4](https://github.com/enkyuan/kipos/pull/4).

## 1. Decision

Rebuild `packages/ui` (to be `@nomi/ui`) on the stack Interfere uses, not just its structure:

- **Tailwind CSS v4, CSS-first.** Tokens in `@theme`, component classes in `@layer components`, type and shadow helpers in `@layer utilities`. StyleX is removed.
- **Base UI** primitives with `data-slot`, `data-variant` and `data-size` attributes (as today, and as Interfere).
- **Radix-style 12-step scales** (solid and alpha, light and dark, P3) as CSS variables, then **semantic roles** in `@theme`, then **component variables** (`--button-*`) read by `nm-*` component classes.
- **Nomi's own palette and fonts.** Interfere's colours are Radix's, which are fine to use, but the brand, the Heldane Text and Berkeley Mono files are not ours to ship.

This supersedes the StyleX parts of ADR 0001 and ADR 0007 (written up as ADR 0008 in the build). It is reversible until the foundations PR merges.

## 2. Why now, and why this reverses StyleX

1. **It is the cheapest moment.** After the strip, `packages/ui` has one primitive (Button) plus tokens, and the web app has one page. A framework change later means porting every primitive and page.
2. **ADR 0007 spent effort working around StyleX.** It generated ~500 lines of scale literals (StyleX needs build-time values), raised the browser floor to Chrome 123 / Safari 17.5 for native `light-dark()`, and could not express descendant selectors (so `base.css` keys on `data-slot`). Interfere's approach needs none of that: scales are variables swapped by a `.dark` class, descendant and `has-[...]`/`*:[...]` selectors are native, `color-mix()` shadows and `pointer: coarse` hit areas are plain CSS.
3. **The technique is the point.** The thing that makes Interfere's primitives cheap to add is the three-tier variable model (scale → role → component variable). That is a CSS idea; Tailwind v4 is just where it lives naturally.
4. **Ecosystem fit.** Base UI's own examples and coss/ui are Tailwind-native, so new primitives are ported by reading, not translated class by class into StyleX.

What it costs: StyleX's typed, atomic, colocated styles and the absence of class-string merging; a rewrite of the one existing primitive and the shell; updates to oxlint, knip, the structure tests and `AGENTS.md`/`apps/AGENTS.md`/`packages/ui/AGENTS.md`.

## 3. Comparison

| Aspect                   | Interfere (measured)                                                                                         | kipos now (`feat/interfere-design-system`, ADR 0007)                            | nomi target                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Styling engine           | Tailwind v4 CSS-first                                                                                        | StyleX                                                                          | Tailwind v4 CSS-first                                                                                                           |
| Primitives               | Base UI, `data-slot`                                                                                         | Base UI, `data-slot`                                                            | Base UI, `data-slot`                                                                                                            |
| Scales                   | Radix, 17 hues, 12 solid + 12 alpha, light/dark/P3                                                           | 8 hand-generated OKLCH scales (`*.stylex.ts` literals), alpha computed to match | same generator, emitted as CSS variables for light, dark and P3                                                                 |
| Roles                    | ~80 `--color-*` in `@theme` (surfaces, component fills with states, intents, foregrounds, borders, inverted) | same names and steps as `color` in `tokens.stylex.ts`, plus `info`              | same names, in `@theme`, plus `info`; brand hue is one config value                                                             |
| Dark mode                | `.dark` re-declares scales and roles; system/light/dark switch                                               | `light-dark()` per role, toggle + head script                                   | `.dark` class + `prefers-color-scheme` fallback + head script (no `light-dark()`, floor drops back to Chrome 111 / Safari 16.4) |
| Components               | `@layer components` `int-*` classes driven by `--button-*` variables                                         | per-primitive `stylex.create`                                                   | `nm-*` classes driven by component variables                                                                                    |
| Type                     | Inter ss03, 13 font-scale steps, `text-heading/body/caption/code-*` utilities, weights incl. 450             | same scale in `fontSize.*`/`lineHeight.*`                                       | same, as `@layer utilities` classes                                                                                             |
| Radius / shadow / motion | 2-24px + pill; 4 layered-hairline shadows; 150ms, named easings                                              | adopted                                                                         | adopted                                                                                                                         |
| Accessibility CSS        | hover gating, reduced motion, coarse-pointer hit areas, `prefers-contrast`, P3                               | contrast test, reduced motion                                                   | all of it, plus the contrast test                                                                                               |
| Fonts                    | Inter, Heldane Text, Berkeley Mono, Departure Mono                                                           | Inter, EB Garamond (wordmark), system mono                                      | Inter (OFL); mono: system stack or an OFL mono; serif only if the nomi brand wants one                                          |
| Docs                     | design.interfere.com, 33 primitives with "Show code"                                                         | none                                                                            | a `/design` route in `apps/web` (phase D)                                                                                       |

## 4. Target structure

```text
packages/ui/
  package.json                 name @nomi/ui; exports ./styles.css, ./button, ...
  src/styles/
    index.css                  @import "tailwindcss"; imports the files below
    scales.css                 GENERATED: --brand-1..12, --brand-a1..a12, gray, positive, warning, danger, info; light, .dark, P3
    theme.css                  @theme: roles (--color-*), fonts, font-scale, radius, shadows, motion, containers
    roles-dark.css             .dark role re-declarations and prefers-contrast overrides
    utilities.css              text-heading-*, text-body-*, text-caption-*, text-code-*, font-semimedium, shadow-*
    components.css             nm-btn + variants/sizes/shapes (and one block per component that needs it)
  src/primitives/*.tsx         Base UI wrappers: data-slot, data-variant, data-size; variants map to nm-* classes
  scripts/palette.ts           the OKLCH 12-step generator (from ADR 0007); writes scales.css
  test/contrast.test.ts        every role pair vs the surface it sits on, AA
  test/tokens.test.ts          every role defined in light, dark and high-contrast; no orphan variables
apps/web/
  vite.config.ts               + @tailwindcss/vite; browser floor back to Chrome 111 / Safari 16.4
  src/app.css                  @import "@nomi/ui/styles.css"
```

Rules for the build (enforced by tests, not review): app and primitive code reads roles only (no `--brand-9`, no hex, no arbitrary colour values); component variants are CSS variables, never inline conditionals; every part has `data-slot`; no StyleX imports remain.

## 5. Carry over from the old branch (do not merge it)

`feat/interfere-design-system` changes 51 files, including primitives and pages that PR #4 deletes, so merging it would conflict everywhere. Reuse by copy:

- the OKLCH generation method and the committed scales (`packages/ui/src/tokens/palette/*.stylex.ts`), turned into `scripts/palette.ts` + `scales.css`;
- `test/contrast.test.ts` (reads scales and checks each text role against its surface; swap the file reader for `scales.css`);
- the role-mapping decisions in ADR 0007 (brand focus uses alpha 9 in light because step 8 is the swatch; `info` added; `brandSurface` bands) and the theme toggle with its pre-paint head script;
- ADR 0007's rationale text, rewritten as ADR 0008.

`feat/notebook-design-system` (Zodiak) is a separate exploration: leave it alone and say so in ADR 0008.

## 6. Phases and PRs (each stacked on the previous, each green on `bun run verify`)

| PR    | Branch                                                              | Content                                                                                                                                                                                                                                                                                                      | Done when                                                                                 |
| ----- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| A     | `chore/rename-kipos-to-nomi` (stacked on `chore/strip-fde-copilot`) | the rename (section 7)                                                                                                                                                                                                                                                                                       | no `kipos` in the tree except history; verify green                                       |
| B     | `feat/nomi-design-system-foundations`                               | Tailwind v4 wired through Vite; `scales.css`, `theme.css`, `roles-dark.css`, `utilities.css`; Button as `nm-btn` (all variants, sizes, shapes, icon-only, pending, link); theme toggle; home page and not-found page on roles only; contrast and token tests; StyleX removed; ADR 0008; AGENTS files updated | home page renders in light/dark/system, contrast + token tests pass, bundle has no StyleX |
| C     | `feat/nomi-primitives-core`                                         | Input, Textarea, Label, Checkbox, Switch, Radio Group, Card, Badge, Divider, Spinner, Skeleton, Tooltip, Dialog, Toast, Tabs (the set a student-facing app needs first), each with a demo                                                                                                                    | each primitive: slots, variants, keyboard and focus behaviour tested                      |
| D     | `feat/nomi-design-route`                                            | a `/design` route that mirrors design.interfere.com: Foundations (colours, radius, shadows, type) and the primitives with live demos and "Show code"                                                                                                                                                         | route is a build-tested page, linked from nowhere in production nav                       |
| later | per feature                                                         | Select, Combobox, Menu, Popover, Command, Table, Drawer, Accordion, Avatar, ...                                                                                                                                                                                                                              | ported when a feature needs them                                                          |

Order is strict for A then B; C and D can run in parallel after B.

## 7. Rename kipos → nomi

Do it first and on its own, as PR A, so the design work is not mixed with it. The tree is already stripped, so the surface is small.

In the repo: package names `@kipos/*` → `@nomi/*` (root, api, web, ui, tsconfig) and every import; `README.md`, `AGENTS.md`, scoped AGENTS files, `docs/**` (keep historical work records and ADR text as written, but update titles and current-state docs), the wordmark text, favicon and page titles, `apps/web` `<title>`, `knip.jsonc`, `tooling/oxlint.json` and `tooling/checks/structure.test.ts` patterns, `.github` strings, the default `data/kipos.sqlite` path wherever documented, `bun.lock` (regenerate with `bun install`). Keep ADR file names; add a line to ADR 0008 recording the rename.

Outside the repo (do after the PRs above settle and while no session has a worktree open, because moving directories breaks them):

```bash
# local folders and worktrees
mv ~/Desktop/Projects/kipos ~/Desktop/Projects/nomi
mv ~/Desktop/Projects/kipos-wt ~/Desktop/Projects/nomi-wt
cd ~/Desktop/Projects/nomi && git worktree repair ~/Desktop/Projects/nomi-wt/*
git worktree list   # every path should now show nomi / nomi-wt

# GitHub (repo settings; GitHub redirects the old URL) — done 2026-10-24
gh repo rename nomi --repo enkyuan/kipos
git remote set-url origin git@github.com:enkyuan/nomi.git
```

Worktree directory names that embed old branch names (`chore-rename-to-kipos`, `feat-interfere-design-system`, ...) are cosmetic; rename or remove stale ones with `git worktree move` / `git worktree remove` once their branches are merged or abandoned. `AGENTS.md` mentions `../kipos-wt/...` in its worktree example; PR A changes it to `../nomi-wt/...`. The Claude Code session folders and any saved paths in tooling (`~/.claude/projects/...kipos...`) are keyed by path and will start fresh after the move.

## 8. Risks and open questions

- **Reverses two ADRs.** If you would rather keep StyleX, the alternative is to stay on ADR 0007 and finish primitives there; everything in sections 3 and 5 still applies except the engine. Decide before PR B merges.
- **Fonts.** Heldane Text and the Berkeley Mono "Interfere" build are licensed; the plan uses Inter and an open mono. If you want a serif voice, pick an OFL serif (EB Garamond is already in the repo for the wordmark).
- **Brand.** The pastel palette from ADR 0007 was kipos's. Nomi may want a different hue; the generator takes one hue, so this is a one-line change plus regenerating `scales.css`. Run a brand pass before PR C if so.
- **Tailwind class strings.** Interfere's long utility strings (`has-[...]`, `*:[...]`) are readable only with discipline: put repeated geometry in `@layer components`, keep one-offs inline, and cover it with the structure test above.
- **Base UI API drift.** Pin `@base-ui/react` exactly (the repo already does).
- **Evidence limits.** The map comes from the live stylesheet and DOM. Component source ("Show code") was not in the DOM, so primitive internals (state attributes, animation timing) must be re-derived by reading the demos, not copied.
