# AGENTS.md — `packages/ui`

The frontend contract in `apps/AGENTS.md` governs how apps consume this
package; this file is only the design-system delta. The decision and its
reasoning are in `docs/decisions/0008-tailwind-design-system.md`; the measured
reference it follows is `docs/design/`.

## What this is

Base UI primitives with data attributes, styled by a three-tier CSS variable
model on Tailwind CSS v4 (CSS-first, no config file): scales, then semantic
roles, then component variables read by `nm-*` classes. Behavior and
accessibility come from Base UI; look comes from the tiers below.

## Layers

```text
scripts/palette.ts    generates scales.css from OKLCH ladders (bun run palette)
src/styles/
  index.css           the entry (`@nomi/ui/styles.css`): Tailwind, fonts,
                      the files below in order, and the base layer
  scales.css          GENERATED. Tier 1: --gray-1..12, --gray-a1..a12 and the
                      same for brand, positive, warning, danger, info, plus
                      black/white alpha. Light on :root, dark on .dark and on
                      the system preference unless .light pins light
  theme.css           Tier 2: `@theme static` — ~90 --color-* roles that
                      point at scale steps, and fonts, type scale, radius,
                      shadows, easings. Tailwind turns these into utilities
  roles-dark.css      the roles whose dark value differs, twice (.dark and the
                      system preference), plus prefers-contrast overrides
  components.css      Tier 3: nm-* classes. A size and a variant class set
                      --button-* style variables; the base class reads them
src/primitives/       one file per component, exported as `@nomi/ui/<name>`
test/                 exports, contrast (AA per mode), token tiers
```

Reading flows one way: components read roles, roles read scales. There is no
other layer. The package imports no app, router, or server code (oxlint
enforces it).

## Rules

- Components read roles (`var(--color-*)`), never scale steps or literal
  colors in `components.css` or primitive classes (`test/tokens.test.ts`).
- Change the palette in `scripts/palette.ts` (a ladder, or one hue number),
  run `bun run palette`, commit `scales.css`. Never edit it by hand.
- A new role goes in `theme.css`; if its dark value differs, add it to both
  dark blocks in `roles-dark.css`. `test/contrast.test.ts` then needs a pair
  for any text role.
- Every part has `data-slot`; controls also expose `data-variant` and
  `data-size`. Variants are classes that set component variables, never inline
  conditionals; hover is gated by `@media (hover: hover)`, motion by
  `prefers-reduced-motion: no-preference`, and touch hit areas grow with
  `@media (pointer: coarse)`.
- Typography is Inter (OFL) with `ss03`, headings included, and the system
  mono. Never add a font that is not redistributable.
- Primitives take `className` for layout only.
- Add a primitive when an app needs it, with its Base UI behavior, its
  `data-slot` parts, and an entry in `package.json` `exports`
  (`test/exports.test.ts` fails until you do).
