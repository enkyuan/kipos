# Interfere design system: structured map

Source: <https://design.interfere.com/> (public docs site), read 2026-10-18 with gstack's headless browser. Values are the site's own stylesheet and computed styles (custom properties, `@layer` rules, `@font-face`, DOM class strings and `data-*` attributes). The machine-readable copy is [`interfere-tokens.json`](interfere-tokens.json). Not read: the component source (the "Show code" blocks are not in the DOM) and the Heldane/Berkeley files' licences.

## 1. Stack and technique (what it is built with)

| Layer                | Finding                                                                                                                                                                                                                                                                                      | Evidence                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSS framework        | **Tailwind CSS v4**, CSS-first: tokens live in `@theme` (`@layer theme`), reusable component classes in `@layer components` (`.int-btn`), type and shadow helpers in `@layer utilities`                                                                                                      | `@layer theme/components/utilities` in `globals-*.css`; `--tw-*` vars; `:root, :host` theme block; `inset-ring-*`, `has-[...]`, `*:[...]` utilities in class strings |
| Primitives           | **Base UI** for behaviour and accessibility; `input-otp` for OTP                                                                                                                                                                                                                             | `data-base-ui-click-trigger`, `data-base-ui-tooltip-trigger`, `data-popup-trigger`; `data-input-otp-container`                                                       |
| Colour model         | **Radix Colors**: 12-step solid + 12-step alpha scale per hue, swapped by `.light` / `.dark` class, with Display-P3 and `prefers-contrast: more` overrides                                                                                                                                   | `--gray-1..12`, `--gray-a1..a12`, 17 hues; `@media (color-gamut: p3)`; `@media (prefers-contrast: more)`                                                             |
| Token tiers          | 1) scales (`--blue-9`) → 2) semantic roles in `@theme` (`--color-brand-solid`) → 3) component variables (`--button-bg`) consumed by `@layer components` classes                                                                                                                              | `--color-brand-solid: var(--blue-9)`; `.int-btn-brand { --button-bg: var(--color-brand-solid) }`                                                                     |
| Component API        | Class-name variants (`int-btn int-btn-md int-btn-primary int-btn-rounded`) plus `data-variant`, `data-size`, `data-slot`, `data-button` attributes; sizes are CSS-variable sets, not utility soup                                                                                            | button DOM and `.int-btn-*` rules                                                                                                                                    |
| Theming              | System / Light / Dark switch; roles re-declared under `.dark, .dark-theme` and `:root.dark`; shadows are variable lists whose parts flip per mode                                                                                                                                            | `.light, .light-theme`, `.dark, .dark-theme`, `:root.dark, .dark, .dark *`                                                                                           |
| Accessibility in CSS | hover gated by `@media (hover: hover)`; transitions gated by `prefers-reduced-motion: no-preference`; `@media (pointer: coarse)` grows hit areas with `::before` (xs −8px, sm −6px, md −4px inset); high-contrast role overrides; `cursor: default` on buttons, `touch-action: manipulation` | `.int-btn` rules                                                                                                                                                     |
| Fonts                | Inter Variable (`ss03`), Heldane Text (serif), Berkeley Mono (custom "Interfere" build), Departure Mono                                                                                                                                                                                      | `@font-face` rules, `--font-*` vars                                                                                                                                  |
| Docs app             | Vite-style SPA, inferred (hashed `/assets/*`), sidebar of Foundations + 33 Primitives, System/Light/Dark switch, "Show code" per demo                                                                                                                                                        | `/assets/globals-*.css`, route list                                                                                                                                  |

## 2. Foundations

### 2.1 Spacing and containers

`--spacing: .25rem` (4px). Every dimension is a multiple (`calc(var(--spacing) * n)`). Containers: `container-xs` 20rem, `container-sm` 24rem, `container-md` 28rem, `container-lg` 32rem, `container-xl` 36rem, `container-2xl` 42rem, `container-3xl` 48rem. Docs content width `max-w-190` (47.5rem).

### 2.2 Colour scales (Radix, light and dark, steps 1-12)

Step meaning (Radix): 1-2 app/subtle backgrounds, 3-5 component backgrounds (normal/hover/active), 6-8 borders, 9 solid, 10 solid hover, 11 low-contrast text, 12 high-contrast text. Alpha ramps `-a1..a12` composite over the page to the solid ramp. P3 variants exist for every step (`color(display-p3 ...)`); both are in the JSON.

| Hue     | Mode  | 1       | 2       | 3       | 4       | 5       | 6       | 7       | 8       | **9**       | 10      | 11      | 12      |
| ------- | ----- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ----------- | ------- | ------- | ------- |
| gray    | light | #fcfcfc | #f9f9f9 | #f0f0f0 | #e8e8e8 | #e0e0e0 | #d9d9d9 | #cecece | #bbb    | **#8d8d8d** | #838383 | #646464 | #202020 |
| gray    | dark  | #111    | #191919 | #222    | #2a2a2a | #313131 | #3a3a3a | #484848 | #606060 | **#6e6e6e** | #7b7b7b | #b4b4b4 | #eee    |
| blue    | light | #fbfdff | #f4faff | #e6f4fe | #d5efff | #c2e5ff | #acd8fc | #8ec8f6 | #5eb1ef | **#0090ff** | #0588f0 | #0d74ce | #113264 |
| blue    | dark  | #0d1520 | #111927 | #0d2847 | #003362 | #004074 | #104d87 | #205d9e | #2870bd | **#0090ff** | #3b9eff | #70b8ff | #c2e6ff |
| indigo  | light | #fdfdfe | #f7f9ff | #edf2fe | #e1e9ff | #d2deff | #c1d0ff | #abbdf9 | #8da4ef | **#3e63dd** | #3358d4 | #3a5bc7 | #1f2d5c |
| indigo  | dark  | #11131f | #141726 | #182449 | #1d2e62 | #253974 | #304384 | #3a4f97 | #435db1 | **#3e63dd** | #5472e4 | #9eb1ff | #d6e1ff |
| iris    | light | #fdfdff | #f8f8ff | #f0f1fe | #e6e7ff | #dadcff | #cbcdff | #b8baf8 | #9b9ef0 | **#5b5bd6** | #5151cd | #5753c6 | #272962 |
| iris    | dark  | #13131e | #171625 | #202248 | #262a65 | #303374 | #3d3e82 | #4a4a95 | #5958b1 | **#5b5bd6** | #6e6ade | #b1a9ff | #e0dffe |
| amber   | light | #fefdfb | #fefbe9 | #fff7c2 | #ffee9c | #fbe577 | #f3d673 | #e9c162 | #e2a336 | **#ffc53d** | #ffba18 | #ab6400 | #4f3422 |
| amber   | dark  | #16120c | #1d180f | #302008 | #3f2700 | #4d3000 | #5c3d05 | #714f19 | #8f6424 | **#ffc53d** | #ffd60a | #ffca16 | #ffe7b3 |
| orange  | light | #fefcfb | #fff7ed | #ffefd6 | #ffdfb5 | #ffd19a | #ffc182 | #f5ae73 | #ec9455 | **#f76b15** | #ef5f00 | #cc4e00 | #582d1d |
| orange  | dark  | #17120e | #1e160f | #331e0b | #462100 | #562800 | #66350c | #7e451d | #a35829 | **#f76b15** | #ff801f | #ffa057 | #ffe0c2 |
| red     | light | #fffcfc | #fff7f7 | #feebec | #ffdbdc | #ffcdce | #fdbdbe | #f4a9aa | #eb8e90 | **#e5484d** | #dc3e42 | #ce2c31 | #641723 |
| red     | dark  | #191111 | #201314 | #3b1219 | #500f1c | #611623 | #72232d | #8c333a | #b54548 | **#e5484d** | #ec5d5e | #ff9592 | #ffd1d9 |
| cyan    | light | #fafdfe | #f2fafb | #def7f9 | #caf1f6 | #b5e9f0 | #9ddde7 | #7dcedc | #3db9cf | **#00a2c7** | #0797b9 | #107d98 | #0d3c48 |
| cyan    | dark  | #0b161a | #101b20 | #082c36 | #003848 | #004558 | #045468 | #12677e | #11809c | **#00a2c7** | #23afd0 | #4ccce6 | #b6ecf7 |
| tomato  | light | #fffcfc | #fff8f7 | #feebe7 | #ffdcd3 | #ffcdc2 | #fdbdaf | #f5a898 | #ec8e7b | **#e54d2e** | #dd4425 | #d13415 | #5c271f |
| tomato  | dark  | #181111 | #1f1513 | #391714 | #4e1511 | #5e1c16 | #6e2920 | #853a2d | #ac4d39 | **#e54d2e** | #ec6142 | #ff977d | #fbd3cb |
| pink    | light | #fffcfe | #fef7fb | #fee9f5 | #fbdcef | #f6cee7 | #efbfdd | #e7acd0 | #dd93c2 | **#d6409f** | #cf3897 | #c2298a | #651249 |
| pink    | dark  | #191117 | #21121d | #37172f | #4b143d | #591c47 | #692955 | #833869 | #a84885 | **#d6409f** | #de51a8 | #ff8dcc | #fdd1ea |
| crimson | light | #fffcfd | #fef7f9 | #ffe9f0 | #fedce7 | #facedd | #f3bed1 | #eaacc3 | #e093b2 | **#e93d82** | #df3478 | #cb1d63 | #621639 |
| crimson | dark  | #191114 | #201318 | #381525 | #4d122f | #5c1839 | #6d2545 | #873356 | #b0436e | **#e93d82** | #ee518a | #ff92ad | #fdd3e8 |
| plum    | light | #fefcff | #fdf7fd | #fbebfb | #f7def8 | #f2d1f3 | #e9c2ec | #deade3 | #cf91d8 | **#ab4aba** | #a144af | #953ea3 | #53195d |
| plum    | dark  | #181118 | #201320 | #351a35 | #451d47 | #512454 | #5e3061 | #734079 | #92549c | **#ab4aba** | #b658c4 | #e796f3 | #f4d4f4 |
| purple  | light | #fefcfe | #fbf7fe | #f7edfe | #f2e2fc | #ead5f9 | #e0c4f4 | #d1afec | #be93e4 | **#8e4ec6** | #8347b9 | #8145b5 | #402060 |
| purple  | dark  | #18111b | #1e1523 | #301c3b | #3d224e | #48295c | #54346b | #664282 | #8457aa | **#8e4ec6** | #9a5cd0 | #d19dff | #ecd9fa |
| violet  | light | #fdfcfe | #faf8ff | #f4f0fe | #ebe4ff | #e1d9ff | #d4cafe | #c2b5f5 | #aa99ec | **#6e56cf** | #654dc4 | #6550b9 | #2f265f |
| violet  | dark  | #14121f | #1b1525 | #291f43 | #33255b | #3c2e69 | #473876 | #56468b | #6958ad | **#6e56cf** | #7d66d9 | #baa7ff | #e2ddfe |
| green   | light | #fbfefc | #f4fbf6 | #e6f6eb | #d6f1df | #c4e8d1 | #adddc0 | #8eceaa | #5bb98b | **#30a46c** | #2b9a66 | #218358 | #193b2d |
| green   | dark  | #0e1512 | #121b17 | #132d21 | #113b29 | #174933 | #20573e | #28684a | #2f7c57 | **#30a46c** | #33b074 | #3dd68c | #b1f1cb |
| grass   | light | #fbfefb | #f5fbf5 | #e9f6e9 | #daf1db | #c9e8ca | #b2ddb5 | #94ce9a | #65ba74 | **#46a758** | #3e9b4f | #2a7e3b | #203c25 |
| grass   | dark  | #0e1511 | #141a15 | #1b2a1e | #1d3a24 | #25482d | #2d5736 | #366740 | #3e7949 | **#46a758** | #53b365 | #71d083 | #c2f0c2 |
| gold    | light | #fdfdfc | #faf9f2 | #f2f0e7 | #eae6db | #e1dccf | #d8d0bf | #cbc0aa | #b9a88d | **#978365** | #8c7a5e | #71624b | #3b352b |
| gold    | dark  | #121211 | #1b1a17 | #24231f | #2d2b26 | #38352e | #444039 | #544f46 | #696256 | **#978365** | #a39073 | #cbb99f | #e8e2d9 |

Black and white alpha: `--black-a1..a12` = black at 5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 95%; `--white-a1..a12` the same in white. Fills: `--color-white-fill #fff`, `--color-black-fill #000`.

Hues in use by role: **gray** (neutral everything), **blue** (brand), **green** (positive), **orange** (warning), **tomato** (danger). The other 12 hues (indigo, iris, amber, red, cyan, pink, crimson, plum, purple, violet, grass, gold) are defined but not wired to roles.

### 2.3 Semantic colour roles (the `@theme` layer)

Roles are the only colours components read. Left column is the token (`--color-…`), then its source in light and in dark.

| Role                                  | Light                     | Dark                      |
| ------------------------------------- | ------------------------- | ------------------------- |
| `white-fill`                          | #fff                      | #fff                      |
| `black-fill`                          | #000                      | #000                      |
| `black-transparent`                   | #0000                     | #0000                     |
| `page`                                | --color-white-fill        | oklch(15% 0 0             |
| `shell`                               | oklch(97.3% 0 0           | --color-black-fill        |
| `container`                           | --color-white-fill        | --gray-1                  |
| `container-recessed`                  | --gray-1                  | --gray-1                  |
| `modal`                               | oklch(100% 0 0            | oklch(25.2% 0 0           |
| `card`                                | --gray-a2                 | --gray-a2                 |
| `sunken`                              | --black-a1                | --black-a6                |
| `standout`                            | --gray-12                 | --gray-3                  |
| `component`                           | --gray-a3                 | --gray-a3                 |
| `component-hover`                     | --gray-a4                 | --gray-a4                 |
| `component-active`                    | --gray-a5                 | --gray-a5                 |
| `component-on-sunken`                 | --color-white-fill        | --gray-4                  |
| `component-on-inverted`               | --white-a2                | --black-a2                |
| `component-on-container-subtle`       | --color-white-fill        | --gray-a2                 |
| `component-on-container-subtle-hover` | --color-white-fill        | --gray-a3                 |
| `component-on-container-strong`       | --color-white-fill        | --gray-a3                 |
| `component-on-container-strong-hover` | --gray-2                  | --gray-a4                 |
| `transparent`                         | --color-black-transparent | --color-black-transparent |
| `transparent-hover`                   | --gray-a3                 | --gray-a4                 |
| `transparent-active`                  | --gray-a3                 | --gray-a3                 |
| `provider-bitbucket`                  | #1e85ff                   | #1e85ff                   |
| `brand-solid`                         | --blue-9                  | --blue-9                  |
| `brand-solid-hover`                   | --blue-10                 | --blue-10                 |
| `brand-solid-active`                  | --blue-11                 | --blue-11                 |
| `brand-subtle`                        | --blue-a3                 | --blue-a3                 |
| `brand-subtle-hover`                  | --blue-a4                 | --blue-a4                 |
| `positive-solid`                      | --green-9                 | --green-9                 |
| `positive-solid-hover`                | --green-10                | --green-10                |
| `positive-subtle`                     | --green-a3                | --green-a3                |
| `positive-subtle-hover`               | --green-a4                | --green-a4                |
| `warning-solid`                       | --orange-9                | --orange-9                |
| `warning-solid-hover`                 | --orange-10               | --orange-10               |
| `warning-subtle`                      | --orange-a3               | --orange-a3               |
| `warning-subtle-hover`                | --orange-a4               | --orange-a4               |
| `danger-solid`                        | --tomato-9                | --tomato-9                |
| `danger-solid-hover`                  | --tomato-10               | --tomato-10               |
| `danger-solid-active`                 | --tomato-11               | --tomato-11               |
| `danger-subtle`                       | --tomato-a2               | --tomato-a2               |
| `danger-subtle-hover`                 | --tomato-a3               | --tomato-a3               |
| `danger-subtle-active`                | --tomato-a5               | --tomato-a5               |
| `inverted-solid`                      | --black-a12               | --white-a12               |
| `inverted-solid-hover`                | --black-a10               | --white-a10               |
| `inverted-solid-active`               | --black-a9                | --white-a9                |
| `disabled`                            | --gray-a3                 | --gray-a2                 |
| `primary-foreground`                  | --gray-a12                | --gray-a12                |
| `secondary-foreground`                | --gray-a11                | --gray-a11                |
| `secondary-foreground-solid`          | --gray-11                 | --gray-11                 |
| `tertiary-foreground`                 | --gray-a9                 | --gray-a9                 |
| `disabled-foreground`                 | --gray-a8                 | --gray-a8                 |
| `brand-foreground`                    | --blue-a10                | --blue-a10                |
| `positive-foreground`                 | --green-a10               | --green-a10               |
| `warning-foreground`                  | --orange-a10              | --orange-a10              |
| `danger-foreground`                   | --tomato-a10              | --tomato-a10              |
| `on-inverted-foreground`              | --color-white-fill        | --color-black-fill        |
| `on-standout-primary-foreground`      | --color-white-fill        | --gray-a12                |
| `on-standout-secondary-foreground`    | --white-a7                | --white-a7                |
| `border-on-standout`                  | --white-a2                | --white-a1                |
| `on-brand-solid-foreground`           | --color-white-fill        | --color-white-fill        |
| `on-brand-subtle-foreground`          | --blue-a9                 | --blue-a11                |
| `on-positive-solid-foreground`        | --green-1                 | --color-white-fill        |
| `on-positive-subtle-foreground`       | --green-a9                | --green-a11               |
| `on-warning-solid-foreground`         | --orange-1                | --color-white-fill        |
| `on-warning-subtle-foreground`        | --orange-a11              | --orange-a11              |
| `on-danger-solid-foreground`          | --tomato-1                | --color-white-fill        |
| `on-danger-subtle-foreground`         | --tomato-a9               | --tomato-a11              |
| `border-default`                      | --gray-a3                 | --gray-a3                 |
| `border-subtle`                       | --gray-a2                 | --gray-a2                 |
| `border-strong`                       | --gray-a6                 | --gray-a6                 |
| `border-strong-solid`                 | --gray-6                  | --gray-6                  |
| `border-inverted`                     | --color-black-fill        | --color-white-fill        |
| `brand-border-default`                | --blue-a6                 | --blue-a6                 |
| `brand-border-subtle`                 | --blue-a5                 | --blue-a5                 |
| `brand-border-focus`                  | --blue-a8                 | --blue-a9                 |
| `positive-border-default`             | --green-a6                | --green-a6                |
| `warning-border-default`              | --orange-a6               | --orange-a6               |
| `danger-border-default`               | --tomato-a6               | --tomato-a6               |
| `danger-border-subtle`                | --tomato-a4               | --tomato-a4               |
| `white-transparent`                   | —                         | #fff0                     |
| `provider-cloudflare`                 | —                         | #f38020                   |
| `provider-aws`                        | —                         | #f90                      |
| `brand-subtle-active`                 | —                         | --blue-a5                 |
| `positive-solid-active`               | —                         | --green-11                |
| `positive-subtle-active`              | —                         | --green-a5                |
| `warning-solid-active`                | —                         | --orange-11               |
| `warning-subtle-active`               | —                         | --orange-a5               |
| `paragraph-foreground`                | —                         | --white-a10               |
| `positive-border-subtle`              | —                         | --green-a5                |
| `warning-border-subtle`               | —                         | --orange-a5               |

Role families: **surfaces** (`page`, `shell`, `container`, `container-recessed`, `modal`, `card`, `sunken`, `standout`), **component fills** (`component`, `-hover`, `-active`, plus `component-on-*` for fills that sit on a surface), **transparent** states, **foreground** ladder (`primary` > `secondary` > `tertiary` > `disabled`), **intents** each with `solid`, `-hover`, `-active`, `subtle`, `-hover`, `-active`, `foreground`, `on-solid-foreground`, `on-subtle-foreground`, `border-default/-subtle/-focus` (brand, positive, warning, danger), **inverted** (the primary button: black in light, white in dark), **borders** (`default`, `subtle`, `strong`, `strong-solid`, `inverted`, `on-standout`), `disabled`, and provider brand colours (`provider-bitbucket/cloudflare/aws`).

`prefers-contrast: more` re-points roles to higher steps: foregrounds to alpha 11-12, borders to alpha 6-8, intent foregrounds and borders to alpha 11.

### 2.4 Radius

| Token          | Value   | Rule          |
| -------------- | ------- | ------------- |
| `rounded-xs`   | 2px     | spacing × 0.5 |
| `rounded-sm`   | 4px     | × 1           |
| `rounded-md`   | 6px     | × 1.5         |
| `rounded-lg`   | 8px     | × 2           |
| `rounded-xl`   | 10px    | × 2.5         |
| `rounded-2xl`  | 12px    | × 3           |
| `rounded-3xl`  | 16px    | × 4           |
| `rounded-4xl`  | 20px    | × 5           |
| `rounded-5xl`  | 24px    | × 6           |
| `rounded-pill` | 2.1e9px | full          |

Seen in use: controls 4-8px (button md/sm 6px, xs 4px, xl 10px), badge `rounded-sm`, card `rounded-2xl`, inset surface wrapper `rounded-3xl`.

### 2.5 Shadows (elevation by layered hairlines, not blur)

| Token             | Light                                                                                                                                                              | Dark                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `--s-border`      | `0 0 0 1px var(--shadow-border-color)`                                                                                                                             | `(parts flip, see JSON)`                                                                                                    |
| `--s-default`     | `0 0 0 .5px var(--shadow-inner-1) inset, 0 0 0 .5px var(--shadow-drop-1), 0 1px 1px -1px var(--shadow-drop-2), 0 1px 2px 0px var(--shadow-drop-3)`                 | `0 0 0 .5px #ffffff12 inset, 0 0 0 .5px #0000, 0 1px 1px -1px #0000, 0 1px 2px 0px #0000`                                   |
| `--s-large`       | `0 0 0 .5px var(--gray-a3), 0 2px 3px -2px var(--gray-a3), 0 3px 12px -4px var(--black-a2), 0 4px 16px -8px var(--black-a1)`                                       | `0 0 0 1px var(--gray-a6), 0 2px 3px -2px var(--black-a3), 0 3px 8px -2px var(--black-a6), 0 4px 12px -4px var(--black-a7)` |
| `--s-extra-large` | `0 0 0 .5px var(--shadow-xl-inner-1) inset, 0 0 0 .5px var(--shadow-xl-drop-1), 0 8px 40px 0px var(--shadow-xl-drop-2), 0 12px 32px -16px var(--shadow-xl-drop-3)` | `(parts flip, see JSON)`                                                                                                    |

The values above are as authored (parts are variables). Resolved light: `--s-default: 0 0 0 .5px #0000 inset, 0 0 0 .5px #0000000f, 0 1px 1px -1px #0000001a, 0 1px 2px 0 #0000000d`; `--s-large: 0 0 0 .5px color-mix(in oklab, #0000000f, #f0f0f0 25%), 0 2px 3px -2px #0000000f, 0 3px 12px -4px #0000001a, 0 4px 16px -8px #0000000d`; `--s-extra-large: 0 0 0 .5px #0000 inset, 0 0 0 .5px #0000000f, 0 8px 40px 0 #0000000d, 0 12px 32px -16px #00000026`; `--s-border: 0 0 0 1px #00000012`. Dark drops the drop shadows and draws a light hairline (`--shadow-inner-1`, `--shadow-border-color: #ffffff12`). Utilities `shadow-default`, `shadow-large`, `shadow-extra-large`, `shadow-border` set `--tw-shadow`. Cards also compose `inset-ring` for the 0.5px hairline.

### 2.6 Typography

**Families**

| Token                 | Stack                                               | Use                                 | Licence note                           |
| --------------------- | --------------------------------------------------- | ----------------------------------- | -------------------------------------- |
| `font-sans`           | InterVariable, `font-feature-settings: "ss03"`      | all product text, headings included | Inter is OFL                           |
| `font-heldane-text`   | HeldaneText 400/500/700 + italics, serif            | editorial/brand moments             | commercial; do not redistribute        |
| `font-mono`           | BerkeleyMono Variable (an Interfere-specific build) | code, labels like `size={1}`        | commercial/custom; do not redistribute |
| `font-departure-mono` | DepartureMono 400                                   | accent                              | open licence (OFL)                     |

**Weights**: normal 400, **semimedium 450 (custom utility)**, medium 500, semibold 600, bold 700.

**Font scale** (`--font-scale-NN`, all derived from `--spacing`): 00 8px · 01 10 · 02 11 · 03 12 · 04 13 · 05 15 · 06 18 · 07 20 · 08 24 · 09 28 · 10 36 · 11 44 · 12 56. `--code-size-xs` = scale 03, `--code-size-sm` = scale 04.

**Utility classes** (`@layer utilities`; each sets font-size and line-height, headings also tracking −0.01em)

| Class                      | Size / line | Notes                           |
| -------------------------- | ----------- | ------------------------------- |
| `text-heading-1`           | 56 / 56     | weight 500 default              |
| `text-heading-2`           | 44 / 56     |                                 |
| `text-heading-3`           | 36 / 44     |                                 |
| `text-heading-4`           | 28 / 36     |                                 |
| `text-heading-5`           | 24 / 32     |                                 |
| `text-heading-6`           | 20 / 24     | page `h1` is heading-6 semibold |
| `text-body-lg`             | 18 / 24     |                                 |
| `text-body-base`           | 15 / 24     | default reading size            |
| `text-body-sm`             | 13 / 20     | UI default (buttons, nav)       |
| `text-caption-lg`          | 12 / 16     |                                 |
| `text-caption-base`        | 11 / 16     |                                 |
| `text-caption-sm`          | 10 / 16     |                                 |
| `text-caption-xs`          | 8 / 12      |                                 |
| `text-code-sm`             | 13 / 20     | inline code                     |
| `text-code-xs`             | 12 / 16     |                                 |
| `uppercase tracking-wider` | `.05em`     | caption casing                  |

Line-height variants exist as `text-body-sm/4`, `/5`, `text-body-base/5`, `text-caption-sm/3.5`, `text-caption-xs/3`. Text pages expose props: Heading `size={1..6}` and `weight`, Text `size` (lg/base/sm), Caption `size` (lg/base/sm/xs) and `uppercase`, Code `size` (base/sm/xs) and `color` (secondary/tertiary/brand/danger). Weights prop: regular/semimedium/medium/semibold.

### 2.7 Motion

Default transition `.15s cubic-bezier(.4,0,.2,1)`. Named curves: `ease-out (0,0,.2,1)`, `ease-in-out (.4,0,.2,1)`, `ease-out-quad (.25,.46,.45,.94)`, `ease-out-cubic (.215,.61,.355,1)`, `ease-out-quint (.23,1,.32,1)`, `ease-in-out-cubic (.645,.045,.355,1)`. Buttons transition colour, background, border at 150ms and transform at 200ms with `ease-out`, only when `prefers-reduced-motion: no-preference`; opt-in press scale `.97` (`int-btn-scales`). `animate-pulse 2s`. Blur: xs 4px, sm 8px, xl 24px.

### 2.8 Brand page

Wordmark (large and small) and the icon (a pixel-dither mark), each with a "Show code" block. Brand assets are Interfere's and not reusable.

## 3. Button in full (the reference component)

Anatomy: `<button class="int-btn int-btn-{shape} int-btn-{size} int-btn-{variant}" data-variant data-size data-button>` wrapping `<span class="int-btn-content">` (text truncates, `svg` sized by `--icon-size`).

**Component variables** set by the size/variant classes and read by `.int-btn`: `--button-height`, `--button-padding-start/end`, `--button-gap`, `--icon-size`, `--kbd-size`, `--icon-offset`, `--button-bg/fg`, `--button-hover-bg/fg`, `--button-active-bg/fg`. Base: font-size scale 04 (13px), weight 500, line-height 1.25rem, `cursor: default`, disabled `not-allowed`.

| Variant                               | bg                            | fg                                    | hover bg             | active bg             | extra                         |
| ------------------------------------- | ----------------------------- | ------------------------------------- | -------------------- | --------------------- | ----------------------------- |
| `primary`                             | inverted-solid                | on-inverted-foreground                | inverted-solid-hover | inverted-solid-active |                               |
| `secondary`                           | component-on-container-strong | primary-foreground                    | …-strong-hover       |                       | `shadow-default` when enabled |
| `tertiary`                            | component                     | secondary-foreground                  | component-hover      | component-active      |                               |
| `brand`                               | brand-solid                   | on-brand-solid-foreground             | brand-solid-hover    | brand-solid-active    |                               |
| `danger`                              | danger-solid                  | on-danger-solid-foreground            | danger-solid-hover   | danger-solid-active   |                               |
| `danger-subtle`                       | danger-subtle                 | danger-foreground                     | danger-subtle-hover  | danger-subtle-active  |                               |
| `transparent`                         | transparent                   | secondary-foreground                  | transparent-hover    |                       | hover fg primary-foreground   |
| `link`, `link-primary`, `link-danger` | transparent                   | secondary / brand / danger foreground |                      |                       | padding 0, weight 500         |

| Size   | height             | padding x  | gap | icon                | kbd                 |
| ------ | ------------------ | ---------- | --- | ------------------- | ------------------- |
| `xs`   | 20px (5)           | 6px (1.5)  | 4px | 12px                | 14px, font scale 03 |
| `sm`   | 24px (6)           | 8px (2)    | 4px | 14px (16 icon-only) | 16px                |
| `md`   | 28px (7)           | 10px (2.5) | 6px | 16px                | 16px                |
| `lg`   | 32px (8)           | 12px (3)   | 6px | 16px                | 16px                |
| `xl`   | 40px (10, default) | 14px (3.5) | 8px | 20px                | 20px                |
| `none` | auto               | 0          | 0   | 16px                | 16px                |

Shapes: `int-btn-rounded` (xs 4px, sm/md 6px, lg+ 8px, icon-only xl 10px) and `int-btn-pill`. `int-btn-icon-only` makes width = height. States: pending, disabled (`transparent` keeps no bg), popup-open (`aria-expanded`) mirrors hover. Touch: `::before` hit-area expansion on `pointer: coarse`.

## 4. Primitives (33)

Doc sections are the demonstrated states. Slots are the `data-slot` parts. Geometry is a representative class string from the live demo (Tailwind utilities against role tokens; truncated).

### Accordion

- **Demos:** Default, Multiple
- **Parts (`data-slot`):** `accordion-item`, `accordion-trigger`
- **Geometry:**
  - `accordion-item` (`<div>`): `border-border-subtle border-b pb-1 last:border-b-0`
  - `accordion-trigger` (`<button>`): `flex min-h-8 w-full items-start gap-2 rounded-xl px-2 pt-2 pb-1 text-start font-medium text-body-sm focus-visible:outline-2 focus-visible:outline-brand-border-focus data-disabled:pointer-events-none data-disabled:text-disabled-for`

### Avatar

- **Demos:** Individual, Group, Sizes, Group sizes, Outline, Shapes
- **Parts (`data-slot`):** `avatar`, `avatar-fallback`, `tooltip-trigger`, `avatar-image`
- **Geometry:**
  - `avatar` (`<span>`): `bg-component font-semimedium relative flex shrink-0 overflow-hidden select-none [leading-trim:both] outline-border-default outline-[0.5px] outline-offset-[-0.5px] text-body-sm/4 size-8 rounded-full`
  - `avatar-fallback` (`<span>`): `flex size-full select-none items-center justify-center text-secondary-foreground`
  - `tooltip-trigger` (`<div>`): `int-avatar-group-item shrink-0 rounded-full p-0.5`
  - `avatar-image` (`<img>`): `aspect-square size-full object-cover`

### Badge

- **Demos:** Variants, Sizes, Shapes

### Breadcrumb

- **Demos:** Default, With ellipsis, Custom separator
- **Parts (`data-slot`):** `breadcrumb-list`, `breadcrumb-item`, `breadcrumb-link`, `breadcrumb-separator`, `breadcrumb-page`, `breadcrumb-ellipsis`
- **Geometry:**
  - `breadcrumb-list` (`<ol>`): `wrap-break-word flex select-none flex-wrap items-center font-medium text-body-sm text-secondary-foreground`
  - `breadcrumb-item` (`<li>`): `inline-flex select-none items-center`
  - `breadcrumb-link` (`<a>`): `int-breadcrumb-item flex items-center gap-1.5 rounded-md bg-transparent py-1 text-secondary-foreground transition-colors hover:bg-transparent-hover hover:text-primary-foreground [&_svg]:size-4 [&_svg]:text-tertiary-foreground [&_s`
  - `breadcrumb-separator` (`<li>`): `flex h-4 w-3 items-center justify-center text-disabled-foreground`

### Button

- **Demos:** Variants, Sizes, With icon, Icon only, Shapes, Pending, Disabled

### Card

- **Demos:** Surfaces, Radius, Elevation, Divided
- **Parts (`data-slot`):** `card`
- **Geometry:**
  - `card` (`<div>`): `flex flex-col shadow-default rounded-2xl bg-component-on-container-subtle min-w-40 flex-1 p-4`

### Checkbox

- **Demos:** Default, Indeterminate, Disabled
- **Parts (`data-slot`):** `checkbox`, `label`
- **Geometry:**
  - `checkbox` (`<span>`): `group peer relative flex size-3.5 shrink-0 items-center justify-center rounded-sm border-[1.5px] transition-[transform,scale,background-color,color] duration-200 ease-out-quint will-change-transform active:scale-[0.97] after:absol`
  - `label` (`<label>`): `flex select-none items-center gap-2 font-medium text-body-base text-secondary-foreground transition-colors duration-100 ease-out peer-disabled:cursor-not-allowed peer-aria-checked:text-primary-foreground group-data-disabled:pointe`

### Code Card

- **Demos:** Default, Highlighted lines, Scrolling body
- **Parts (`data-slot`):** `code-card`, `code-card-header`, `code-card-content`, `scroll-area-viewport`, `scroll-area-content`
- **Geometry:**
  - `code-card` (`<div>`): `not-prose flex min-w-0 flex-col overflow-hidden rounded-xl relative shadow-[0_0_0_0.5px_var(--shadow-drop-1),0_1px_1px_-1px_var(--shadow-drop-2),0_1px_2px_0px_var(--shadow-drop-3)] after:pointer-events-none after:absolute after:in`
  - `code-card-header` (`<div>`): `relative z-1 flex items-center border-b-[0.5px] py-1 pr-1 pl-2 border-(--code-divider,var(--color-border-default)) justify-between gap-1`
  - `code-card-content` (`<div>`): `box-content min-h-0 flex-1 [--scroll-area-vertical-gradient-size:0px] **:data-[slot=scroll-area-content]:min-h-full **:data-[slot=scroll-area]:flex-1 **:data-[slot=scroll-area-viewport]:scroll-pt-3 **:data-[slot=scroll-area-viewpo`
  - `scroll-area-viewport` (`<div>`): `h-full rounded-[inherit] data-has-overflow-y:overscroll-y-contain base-ui-disable-scrollbar`

### Collapsible

- **Demos:** Default, Initially open, Without animation
- **Parts (`data-slot`):** `collapsible-trigger`, `collapsible-content`, `collapsible`
- **Geometry:**
  - `collapsible-trigger` (`<button>`): `int-btn relative int-btn-rounded int-btn-md int-btn-secondary`
  - `collapsible-content` (`<div>`): `overflow-hidden`
  - `collapsible` (`<div>`): `not-prose flex min-w-0 flex-col overflow-hidden relative shadow-[0_0_0_0.5px_var(--shadow-drop-1),0_1px_1px_-1px_var(--shadow-drop-2),0_1px_2px_0px_var(--shadow-drop-3)] after:pointer-events-none after:absolute after:inset-0 after`

### Combobox

- **Demos:** Default, Placeholder, Disabled
- **Parts (`data-slot`):** `combobox-trigger`, `combobox-value`
- **Geometry:**
  - `combobox-trigger` (`<button>`): `group flex w-full items-center justify-between gap-2 whitespace-nowrap ring-0 transition-[color,background-color,border-color,box-shadow] duration-75 ease-out outline-none select-none data-placeholder:select-none *:data-[slot=sele`
  - `combobox-value` (`<span>`): `min-w-0 truncate`

### Command

- **Demos:** Command menu

### Context Menu

- **Demos:** Default, Grouped
- **Parts (`data-slot`):** `context-menu-trigger`
- **Geometry:**
  - `context-menu-trigger` (`<div>`): `select-none data-popup-open:bg-transparent-hover rounded-md bg-transparent px-1.5 transition-colors duration-200 ease-out`

### Dialog

- **Demos:** Default, With footer, Small title, Large title, Without close button, Danger
- **Parts (`data-slot`):** `dialog-trigger`
- **Geometry:**
  - `dialog-trigger` (`<button>`): `int-btn relative int-btn-rounded int-btn-md int-btn-secondary`

### Divider

- **Demos:** Sizes, Colors, Vertical, Padding

### Drawer

- **Demos:** Default, With close button, Directions
- **Parts (`data-slot`):** `drawer-trigger`
- **Geometry:**
  - `drawer-trigger` (`<button>`): `int-btn relative int-btn-rounded int-btn-md int-btn-secondary`

### Input

- **Demos:** Default, Inline, Ghost, With icon, States
- **Parts (`data-slot`):** `input-group`, `input`
- **Geometry:**
  - `input-group` (`<div>`): `flex w-full min-w-0 ring-0 transition-[color,border-color,box-shadow,background-color] duration-150 outline-none *:data-placeholder:select-none text-caption-lg h-6 rounded-md ps-1.5 pe-1 [--input-scale:0.75] inset-ring-[0.5px] foc`
  - `input` (`<input>`): `min-w-0 flex-1 self-stretch bg-transparent text-inherit caret-inherit outline-none file:text-body-sm file:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium pointer-coarse:w-[calc(`

### Input Otp

- **Demos:** Four digits, Six digits, Invalid
- **Parts (`data-slot`):** `input-otp-group`, `input-otp-slot`, `input-otp`
- **Geometry:**
  - `input-otp-group` (`<div>`): `flex flex-1 gap-2`
  - `input-otp-slot` (`<div>`): `relative inset-ring flex aspect-square flex-1 items-center justify-center rounded-md transition-[color,background-color,box-shadow] duration-150 inset-ring-border-default bg-component-on-container-strong text-primary-foreground da`
  - `input-otp` (`<input>`): `disabled:cursor-not-allowed`

### Kbd

- **Demos:** Sizes, Combinations, Fit, Long labels, Inverted, In a tooltip, Disabled
- **Parts (`data-slot`):** `tooltip-trigger`
- **Geometry:**
  - `tooltip-trigger` (`<button>`): `int-btn relative int-btn-rounded int-btn-md int-btn-secondary`

### Label

- **Demos:** With checkbox
- **Parts (`data-slot`):** `checkbox`, `label`
- **Geometry:**
  - `checkbox` (`<span>`): `group peer relative flex size-3.5 shrink-0 items-center justify-center rounded-sm border-[1.5px] transition-[transform,scale,background-color,color] duration-200 ease-out-quint will-change-transform active:scale-[0.97] after:absol`
  - `label` (`<label>`): `flex select-none items-center gap-2 font-medium text-body-base text-secondary-foreground transition-colors duration-100 ease-out peer-disabled:cursor-not-allowed peer-aria-checked:text-primary-foreground group-data-disabled:pointe`

### Menu

- **Demos:** Default, Shortcuts, Checkbox, Radio group, Submenu, Checkbox submenu, Inset
- **Parts (`data-slot`):** `menu-trigger`
- **Geometry:**
  - `menu-trigger` (`<button>`): `int-btn relative int-btn-rounded int-btn-md int-btn-secondary group select-none`

### Popover

- **Demos:** Picker, Positions
- **Parts (`data-slot`):** `popover-trigger`, `avatar`, `avatar-image`
- **Geometry:**
  - `popover-trigger` (`<button>`): `int-btn relative int-btn-rounded int-btn-md int-btn-secondary ps-2 group select-none`
  - `avatar` (`<span>`): `bg-component font-semimedium relative flex shrink-0 overflow-hidden select-none [leading-trim:both] outline-border-default outline-[0.5px] outline-offset-[-0.5px] text-caption-xs/3 size-4 rounded-full`
  - `avatar-image` (`<img>`): `aspect-square size-full object-cover`

### Radio Group

- **Demos:** Default, Disabled, Radio group, Card choice box, Row choice box, Tile choice box
- **Parts (`data-slot`):** `radio-group`, `radio-group-item`, `label`
- **Geometry:**
  - `radio-group` (`<div>`): `grid items-center gap-3 data-disabled:[&_label]:cursor-not-allowed data-disabled:[&_label]:text-disabled-foreground [&_label]:ps-2`
  - `radio-group-item` (`<span>`): `group peer relative aspect-square size-4 shrink-0 rounded-full data-disabled:cursor-not-allowed group-aria-invalid:bg-danger-subtle group-aria-invalid:active:bg-danger-subtle-active group-aria-invalid:hover:bg-danger-subtle-hover`
  - `label` (`<label>`): `flex select-none items-center gap-2 font-medium text-body-base text-secondary-foreground transition-colors duration-100 ease-out peer-disabled:cursor-not-allowed peer-aria-checked:text-primary-foreground group-data-disabled:pointe`

### Reaction

- **Demos:** States, Group
- **Parts (`data-slot`):** `reaction`, `reaction-emoji`
- **Geometry:**
  - `reaction` (`<button>`): `inline-flex h-6 items-center justify-center gap-1 rounded-full border px-1.5 select-none text-body-sm transition-colors border-border-default text-secondary-foreground hover:bg-transparent-hover`
  - `reaction-emoji` (`<span>`): `text-black-fill text-base`

### Scroll Area

- **Demos:** Vertical, Horizontal
- **Parts (`data-slot`):** `scroll-area`, `scroll-area-viewport`, `scroll-area-content`, `scroll-area-scrollbar`, `scroll-area-thumb`
- **Geometry:**
  - `scroll-area` (`<div>`): `box-content h-48 w-full [--scroll-area-surround-color:var(--color-component-on-container-subtle)] dark:[--scroll-area-surround-color:var(--gray-2)]`
  - `scroll-area-viewport` (`<div>`): `h-full rounded-[inherit] data-has-overflow-y:overscroll-y-contain base-ui-disable-scrollbar`
  - `scroll-area-content` (`<div>`): `flex h-full flex-col`
  - `scroll-area-scrollbar` (`<div>`): `flex rounded-full bg-component opacity-0 transition-opacity data-scrolling:pointer-events-auto data-scrolling:opacity-100 data-scrolling:duration-0 select-none data-hovering:pointer-events-auto data-hovering:opacity-100 w-1 justif`

### Select

- **Demos:** Default, Sizes, Grouped, States, Inline, With description, Danger item
- **Parts (`data-slot`):** `select-trigger`
- **Geometry:**
  - `select-trigger` (`<button>`): `group flex w-full items-center justify-between gap-2 whitespace-nowrap ring-0 transition-[color,background-color,border-color,box-shadow] duration-75 ease-out outline-none select-none data-placeholder:select-none *:data-[slot=sele`

### Skeleton

- **Demos:** Shapes, Text block, List row
- **Parts (`data-slot`):** `skeleton`
- **Geometry:**
  - `skeleton` (`<span>`): `bg-component block animate-pulse rounded-full size-10`

### Spinner

- **Demos:** Sizes, Colors

### Switch

- **Demos:** Default, Sizes, With label, Disabled
- **Parts (`data-slot`):** `switch`, `switch-thumb`, `label`
- **Geometry:**
  - `switch` (`<button>`): `peer group relative inline-flex shrink-0 items-center justify-start rounded-full p-0.5 transition-[color,background-color,border-color,box-shadow] data-checked:justify-end not-data-disabled:data-checked:bg-brand-solid not-data-dis`
  - `switch-thumb` (`<span>`): `pointer-events-none block shrink-0 rounded-full ring-0 bg-on-brand-solid-foreground group-data-disabled:bg-disabled-foreground h-3`
  - `label` (`<label>`): `flex select-none items-center gap-2 font-medium text-body-base text-secondary-foreground transition-colors duration-100 ease-out peer-disabled:cursor-not-allowed peer-aria-checked:text-primary-foreground group-data-disabled:pointe`

### Table

- **Demos:** Default, With footer
- **Parts (`data-slot`):** `table-container`, `table`, `table-header`, `table-row`, `table-head`, `table-body`, `table-cell`, `table-footer`
- **Geometry:**
  - `table-container` (`<div>`): `relative w-full scrollbar-none overflow-x-auto overscroll-x-contain`
  - `table` (`<table>`): `w-full caption-bottom tabular-nums`
  - `table-header` (`<thead>`): `[&_tr]:border-b-[0.5px] [&_tr]:border-b-border-default`
  - `table-row` (`<tr>`): `border-b-border-default aria-selected:bg-transparent-hover border-b-[0.5px]`

### Tabs

- **Demos:** Default, Underline, Sizes
- **Parts (`data-slot`):** `tabs-list`, `tabs-indicator`, `tabs-trigger`, `tabs-content`
- **Geometry:**
  - `tabs-list` (`<div>`): `text-body-base relative items-center font-medium *:data-[slot=tabs-trigger]:h-10 md:text-body-sm *:data-[slot=tabs-trigger]:md:h-7 bg-component inline-flex rounded-lg *:data-[slot=tabs-trigger]:rounded-lg *:data-[slot=tabs-trigger`
  - `tabs-indicator` (`<span>`): `pointer-events-none absolute top-0 left-0 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) translate-y-(--active-tab-top) transition-[translate,width,height] duration-200 ease-out after:absolute after`
  - `tabs-trigger` (`<button>`): `text-secondary-foreground relative z-10 inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap transition-colors duration-200 ease-in-out rounded-md not-data-disabled:hover:text-primary-foreground not-data-d`
  - `tabs-content` (`<div>`): `flex-1 outline-none pt-4`

### Textarea

- **Demos:** Default, Ghost, States
- **Parts (`data-slot`):** `textarea`
- **Geometry:**
  - `textarea` (`<textarea>`): `file:text-body-sm file:text-primary-foreground flex field-sizing-content w-full min-w-0 resize-none ring-0 transition-[color,border-color,box-shadow,background-color] duration-150 outline-none file:inline-flex file:h-7 file:border`

### Toast

- **Demos:** Default, Success, Error, Warning, Info, Loading, Promise

### Tooltip

- **Demos:** Positions, Alignment
- **Parts (`data-slot`):** `tooltip-trigger`
- **Geometry:**
  - `tooltip-trigger` (`<button>`): `int-btn relative int-btn-rounded int-btn-md int-btn-secondary`

(Pages for Command and Drawer exist as `/command` and `/drawer`; their parts are cmdk-style list and Base UI drawer. Their markup used the shared Button and menu classes above.)

## 5. Cross-cutting patterns worth copying

- **Roles, not shades.** Components never reference `--blue-9`; they read `--color-brand-solid`. Re-theming is a change to one block.
- **Component variables.** Variant classes only set `--button-*` variables; one rule block applies them. Adding a variant is 4 lines.
- **Surface-aware fills.** `component-on-container-subtle/strong`, `component-on-sunken`, `component-on-inverted` exist because a fill must change with the surface it sits on.
- **Hairline elevation.** 0.5px hairlines + soft drops (light) or a light hairline only (dark); `inset-ring` for card edges.
- **Alpha steps.** Foregrounds and subtle fills use alpha steps so one role composites correctly on any surface.
- **Size by variables.** Heights are `spacing × n` (20/24/28/32/40px); icon size and gaps ride along.
- **Type is tokens.** 13 font-scale steps; named utilities pair size with line-height; headings are weight 500 with −0.01em tracking, UI default is 13px.
- **Accessibility baked into CSS.** `hover: hover`, reduced motion, coarse-pointer hit areas, `prefers-contrast`, P3 gamut.
- **Semantic attributes.** `data-slot` on every part, `data-variant`/`data-size` on controls: styleable and testable without class parsing.
