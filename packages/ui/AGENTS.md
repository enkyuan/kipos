# AGENTS.md — `packages/ui`

The frontend contract in `apps/AGENTS.md` governs how apps consume this
package; this file is only the design-system delta.

## What this is

Base UI (<https://base-ui.com>) primitives styled with StyleX tokens. Base UI
owns behavior and accessibility (focus, keyboard, ARIA, disabled semantics,
the `render` prop); this package owns how they look and exposes a small,
typed API (`variant`, `size`, `xstyle`).

## Layers

```text
src/tokens/
  palette.stylex.ts    primitive OKLCH colors, read only by tokens.stylex.ts:
                       warm neutrals (warm<lightness>), peach and petal,
                       and Tailwind status shades
  tokens.stylex.ts     semantic roles plus brand roles as StyleX tokens:
                       color, radius, font (vars); space, fontSize,
                       lineHeight, fontWeight, tracking, shadow, motion,
                       media (consts)
  base.css             the base layer: font faces, borders, body, and the
                       descendant rules StyleX cannot express. It sits below
                       StyleX's layers, so it cannot override a property a
                       primitive sets.
src/fonts/             Glide and Glide Mono (woff2, OFL.txt), declared in
                       base.css. base.css also declares Zodiak at
                       zodiak-variable.woff2, which is gitignored: place the
                       unmodified Fontshare file there; never commit it
src/primitives/        one file per component, exported as `@ouro/ui/<name>`
test/                  public-export contract
```

`tokens → primitives`. There is no other layer. The package imports no app,
router, or server code (oxlint enforces it).

## Adding a primitive

1. Start from the Base UI part (`@base-ui/react/<component>`) and its
   anatomy (`Root`, `Trigger`, `Portal`, `Positioner`, `Popup`, ...). Read the
   component's page on base-ui.com or the `base-ui` skill.
2. Wrap each part you style; keep Base UI's part names and props, and add
   only `variant`/`size` where a design needs them. Set `data-slot` on the
   root so `base.css` can reach descendants.
3. Style with `stylex.create` from tokens. Style states through Base UI's
   data attributes and native pseudo-classes:

   ```text
   [data-popup-open], [data-highlighted], [data-checked], [data-disabled]
   :hover under media.hover, :focus-visible, :disabled
   enter/exit: [data-starting-style] / [data-ending-style] + transitions
   ```

4. Descendant selectors (`svg` inside a button) cannot be expressed in
   StyleX. Put them in `base.css`, keyed on `data-slot`, or restructure.
5. Replace `className`/`style` with an `xstyle?: stylex.StyleXStyles` prop,
   applied last so callers win. Pass `render` through; a non-button element
   rendered by a button-like part needs `nativeButton={false}`.
6. Add the subpath to `package.json` `exports`. `test/exports.test.ts` fails
   until you do.

## Rules

- Primitives read semantic tokens only; numbered shades stay in
  `palette.stylex.ts`.
- `defineVars` for the groups a theme may override (`color`, `radius`,
  `font`), even where a value is the same in light and dark; everything else
  is `defineConsts`, inlined at build time.
- Color follows 60 / 30 / 10 (`docs/decisions/0008-notebook-design-system.md`):
  paper (`background`, `card`, `popover`), graphite (`secondary`, `muted`,
  `accent`), colour (`primary`, `brand*`). Status roles sit outside it.
  Brand colors reach components as roles, never palette entries; a new role
  notes its contrast pairs in both themes beside its value.
- Typography: `font.heading` (Zodiak) for headings and the wordmark, with
  `tracking.heading` and an explicit `fontWeight` (400 or 500: headings
  otherwise take the browser's bold, too heavy for Zodiak); `font.sans` (Glide)
  for everything else; `font.mono`
  (Glide Mono) for code. Never convert or subset the Zodiak file.
- Radii form a concentric ladder (sm 10, md 14, lg 20, xl 26, xxl 32 px): a
  child inset by the step between two radii takes the smaller one. Buttons
  are pills.
- StyleX evaluates styles at build time: values must be literals, token
  references, or template strings of them — no runtime computation.
- `base.css` repeats a handful of token values in plain CSS (it cannot read
  StyleX variables). Change both together.
- Do not add a primitive until an app needs it.
