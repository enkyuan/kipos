# AGENTS.md — `packages/ui`

The frontend contract in `apps/AGENTS.md` governs how apps consume this
package; this file is only the design-system delta.

## What this is

coss/ui (<https://coss.com/ui>) — Base UI primitives with coss's base theme —
translated from Tailwind classes to StyleX. Behavior and accessibility come
from Base UI; geometry, color, and states come from coss, class by class.

## Layers

```text
src/tokens/
  palette.stylex.ts    primitive OKLCH colors, read only by tokens.stylex.ts:
                       the Tailwind shades coss's theme uses, and the brand
                       ramps (darkSalmon, lightPink, lavenderBlush 50–950)
  tokens.stylex.ts     coss's semantic variables plus brand roles as StyleX
                       tokens: color, radius, font (vars); space, fontSize,
                       lineHeight, fontWeight, tracking, shadow, motion,
                       media (consts)
  base.css             coss's base layer: fonts, borders, body, the
                       descendant rules StyleX cannot express (button
                       icon sizing). It sits below StyleX's layers, so it
                       cannot override a property a primitive sets.
src/primitives/        one file per coss component, exported as
                       `@kipos/ui/<name>`
test/                  public-export contract
```

`tokens → primitives`. There is no other layer. The package imports no app,
router, or server code (oxlint enforces it).

## Translating a coss component

1. Fetch the source: `packages/ui/src/components/<name>.tsx` in
   `github.com/cosscom/coss`, and read the matching guide in the `coss` skill.
2. Keep coss's public API: component and part names, `variant` and `size`
   values, defaults, and `data-slot` attributes.
3. Translate classes to `stylex.create` using the token names, which mirror
   coss's variables and Tailwind's scale:

   ```text
   bg-primary            → backgroundColor: color.primary
   text-muted-foreground → color: color.mutedForeground
   p-6 / px-2.5          → padding: space.s6 / paddingInline: space.s2_5
   rounded-lg            → borderRadius: radius.lg
   h-9 sm:h-8            → height: { default: "2.25rem", [media.sm]: "2rem" }
   hover:bg-primary/90   → ":hover": `color-mix(in srgb, ${color.primary} 90%, transparent)`
   has-focus-visible:…   → [":has(:focus-visible)"]: …
   before:shadow-[…]     → "::before": { content: "''", …, boxShadow: color.highlight }
   dark:…                → [media.dark] condition, or a dark value in tokens
   ```

4. Descendant selectors (`[&_svg]:size-4`, `*:data-[slot=x]:…`) cannot be
   expressed in StyleX. Put them in `base.css`, keyed on `data-slot`, or
   restructure (a component owns its rhythm with `gap` instead of sibling
   selectors).
5. Replace `className` with an `xstyle?: stylex.StyleXStyles` prop, applied
   last so callers win. Accept Base UI's `render` prop where coss does.
6. Add the subpath to `package.json` `exports`. `test/exports.test.ts` fails
   until you do.

## Rules

- Primitives read semantic tokens only; numbered shades stay in
  `palette.stylex.ts`.
- `defineVars` for the groups a theme may override (`color`, `radius`,
  `font`), even where a value is the same in light and dark; everything else
  is `defineConsts`, inlined at build time.
- Brand colors reach components as roles (`color.brand`, `brandText`,
  `brandSurface`, ...), never ramp steps. A new ramp is named by its
  nearest CSS named color and documented in an ADR
  (`docs/decisions/0002-brand-typography-and-palette.md`).
- Typography: `font.heading` (EB Garamond) for headings and the wordmark,
  with `tracking.heading`; `font.sans` (Inter) for everything else.
- StyleX evaluates styles at build time: values must be literals, token
  references, or template strings of them — no runtime computation.
- `base.css` repeats a handful of token values in plain CSS (it cannot read
  StyleX variables). Change both together.
- Do not add a primitive until an app needs it; port it from coss when it
  does.
