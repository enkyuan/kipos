# Brand typography and palette

State: DONE
Branch: main (uncommitted)
Base SHA: none
Head SHA: uncommitted
Completed: 2026-10-11

## Goal

Apply the optimus brand guide: EB Garamond paired with one sans (Inter or
Geist), and the primary palette in OKLCH with named shade ramps.

## Final behavior

- `font.heading` is EB Garamond (headings, wordmark, card titles) with
  `tracking.heading` (−0.02em); `font.sans` stays Inter; Geist Mono removed.
- `palette.stylex.ts` gains `darkSalmon`, `lightPink`, `lavenderBlush`
  50–950; `color` gains `brand`, `brandForeground`, `brandText`,
  `brandSurface`, `brandSurfaceStrong`.
- Landing: Garamond wordmark and headings, a lavender-blush hero band, and a
  brand-tinted badge.

## Decisions

`docs/decisions/0002-brand-typography-and-palette.md` (pairing scores: Inter
9/10, Geist 6/10; naming by nearest CSS named color; lavender blush chroma
cap).

## Verification

- `bun run verify` passes.
- Browser (dev): `h1` computes to EB Garamond and body to Inter, both loaded
  (`document.fonts.check`); desktop and 375px screenshots; waitlist join
  works; no console errors.
- Every ramp step checked in sRGB gamut after rounding.
