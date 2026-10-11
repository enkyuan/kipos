# 0002 — Brand typography and palette

Date: 2026-10-11
Status: accepted

## Context

The optimus brand guide sets the logotype and its typography in EB Garamond
and defines a primary palette of four swatches: an orange (#eb9a6b), a pink
(#eeb2b2), a pale blush (#ffeef4) and white. The coss/ui base theme pairs
Inter with Geist Mono. The brand should ship one sans companion to Garamond,
not two.

## Decision

**EB Garamond for headings and the wordmark; Inter for everything else.**

| Pairing             | Assessment                                                                                                                                                                                                                          | Score |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| EB Garamond + Inter | Inter's humanist-leaning grotesque matches the sans in the guide's slide titles and the brand's warm, human tone; its large x-height keeps UI text legible beside Garamond's small one; the pair is a proven editorial combination. | 9/10  |
| EB Garamond + Geist | Geist is geometric and technical; its rigid construction fights Garamond's calligraphic stress and pulls the tone cold.                                                                                                             | 6/10  |

Geist Mono is removed; code falls back to the system monospace
(`font.mono`). Headings use the guide's "Spacing −2" as `tracking.heading`
(−0.02em).

**Palette in OKLCH, named by nearest CSS named color** (Oklab distance):

| Swatch  | Name           | Step              | OKLCH                       |
| ------- | -------------- | ----------------- | --------------------------- |
| #eb9a6b | dark salmon    | `darkSalmon400`   | `oklch(0.757 0.116 50.414)` |
| #eeb2b2 | light pink     | `lightPink300`    | `oklch(0.819 0.07 18.696)`  |
| #ffeef4 | lavender blush | `lavenderBlush50` | `oklch(0.964 0.02 353.985)` |
| #ffffff | white          | `white`           | `oklch(1 0 0)`              |

Each colored swatch gets a 50–950 ramp: the swatch sits unchanged at the
step nearest its lightness; other steps keep its hue and its share of the
in-gamut (sRGB) chroma. Lavender blush caps chroma at 0.06 so its darker
steps stay dusty instead of turning magenta.

Components consume brand roles, never ramp steps: `color.brand`,
`brandForeground`, `brandText`, `brandSurface`, `brandSurfaceStrong`.

## Consequences

- White text on dark salmon measures 2.2:1, so the brand orange never
  carries white text; `brandForeground` (neutral 800, 6.7:1) does.
- coss's neutral `primary` stays the main action color, matching the
  guide's charcoal slides; the brand colors tint surfaces and accents.
