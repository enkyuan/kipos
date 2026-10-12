# 0008 — Notebook design system

Date: 2026-10-11
Status: accepted; supersedes the palette and typography of 0002 and the palette
and heading face of 0007

## Context

The scaffold reset (0007) kept the coss-era palette and EB Garamond while the
product's visual language restarts. The Living Notebook design system sets
that language: calm by default, playful when touched, alive when it matters.
It is a black-and-white notebook in which colour marks what is alive or
actionable, and its headings share Zodiak with ryo.

## Decision

**Color is split 60 / 30 / 10 by painted area**, and every semantic role
belongs to one tier:

| Tier     | Share | Roles                                      | Values (light / dark)                   |
| -------- | ----- | ------------------------------------------ | --------------------------------------- |
| Paper    | 60    | `background`, `card`, `popover`            | white / warm near-black (L 0.165–0.205) |
| Graphite | 30    | `secondary`, `muted`, `accent`             | warm grey L 0.955 / L 0.24              |
| Colour   | 10    | `primary`, `brand`, `brandSurface(Strong)` | peach, peach and petal washes           |

Status colors (`destructive`, `info`, `success`, `warning`) are signals and
sit outside the split. Neutrals carry hue 50–60 at chroma ≤ 0.006, so greys
sit with the peach instead of reading blue. All values are OKLCH inside sRGB;
the pale washes sit at 95% of their gamut limit.

**`primary` is peach**, the one colored action in a view, with dark text
(`primaryForeground`, 9.73:1; white on peach is 1.7:1). This reverses 0002's
neutral primary. `ring` and `brandText` are a solid terracotta (`peachInk`):
6.08:1 on white, so the focus ring meets 3:1 on any surface. Every foreground
role meets WCAG AA on the surfaces it pairs with, in both themes; the values
are noted beside each role in `tokens.stylex.ts`.

**Typography.** Zodiak (Indian Type Foundry, Fontshare FFL) replaces EB
Garamond for headings and the wordmark; Glide and Glide Mono are unchanged.
Zodiak is the unmodified Fontshare woff2 (the FFL forbids converting or
subsetting it), self-hosted from `packages/ui/src/fonts/zodiak-variable.woff2`.
The file is gitignored: this repository is public, and the FFL forbids making
the font available through a repository or public server. Without the file
the build still succeeds and headings fall back to Iowan Old Style, then
Georgia. Headings
without a weight take the browser's bold (700), too heavy for Zodiak, so every
heading style sets `fontWeight` (400 or 500). The `@font-face` declares the
file's 100–900 weight range; without it the variable file renders at its
default coordinate, 900. `tracking.heading` is −0.01em.

**Shape.** The radius scale is a concentric ladder: sm 10, md 14, lg 20,
xl 26, xxl 32 (px), each the step below plus the inset between them, so a
child inset by 4px (sm→md) or 6px (above) keeps parallel corners. Buttons are
pills.

**Motion.** One duration per interaction: press 120ms to scale 0.96 on
`easeOut`, color 150ms, select 200ms on `easeInOut`, unfold 260ms on
`easeDrawer`, fold 180ms. Hover applies only under
`(hover: hover) and (pointer: fine)`. The focus ring is 2px at a 2px offset
filled with the page color.

## Consequences

- `@fontsource-variable/eb-garamond` is removed; the brand ramps
  (darkSalmon, lightPink, lavenderBlush) are replaced by single peach and
  petal values and their washes. A new brand color is added as a named
  primitive in `palette.stylex.ts` and a role in `tokens.stylex.ts`, with
  its contrast pairs noted.
- On white, `card` and `popover` match `background`; a raised surface needs
  a shadow to separate. At night they step one shade lighter.
- The FFL does not allow serving Zodiak to third parties as a font service
  (for example a hosted design tool), or committing it to this public
  repository. Self-hosting it in ouro's own deployed app is permitted.
- A machine without the file (CI, a fresh clone) renders the fallback serif.
  Place the font from Fontshare at `packages/ui/src/fonts/zodiak-variable.woff2`
  to see Zodiak locally; a deploy needs a private step that supplies the same
  file before the build.
- The student-facing parts of the design system (message bubbles, practice
  cards, Blobatar motion states) become primitives only when a screen needs
  them.
