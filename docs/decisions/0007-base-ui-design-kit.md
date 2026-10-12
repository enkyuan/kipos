# 0007 — Base UI design kit

Date: 2026-10-11
Status: accepted

## Context

The product was reset to its base scaffold to restart design. The design
system had been coss/ui translated class by class into StyleX: its look,
its component APIs, and a translation procedure tied to coss's Tailwind
source. The next screens need a faster design loop and their own visual
language, not a port of someone else's.

## Decision

- **Base UI directly.** `packages/ui` wraps `@base-ui/react` parts and styles
  them with the existing StyleX tokens and palette (kept unchanged). The
  token names keep the familiar shadcn-style role vocabulary. Coss's
  primitives are removed; `Button` is rebuilt on Base UI's `Button`.
- **Type:** EB Garamond for headings and the wordmark, Glide for UI text,
  Glide Mono for code (amendment to 0002).
- **Design libraries in `apps/web`:**
  - `motion` for presence, springs, gestures and layout animation. This
    widens 0005 (presence only): simple state transitions (hover, press,
    focus) still stay CSS, which interrupts well off the main thread.
    Every Motion tree sets `MotionConfig reducedMotion="user"`.
  - `blode-icons-react` for icons (Lucide-compatible props and names).
  - `@blobatar/react` (with `blobatar`) for deterministic avatars of people
    and bots without a picture.
  - `dialkit` for live tuning: components register values with
    `useDialKit`; the panel mounts in development only (`dev-tools.tsx`),
    and builds use the defaults.
- **The home page is the design kit** (`features/kit`), so every primitive
  has a working example until product screens replace it.

## Consequences

- `useDialKit` ships its store in the production bundle (the panel does
  not). Remove a tuning call once its values settle.
- `blode-icons-react`'s ESM entry uses an extensionless import that Node
  refuses during dev SSR, so `vite.config.ts` bundles it (`ssr.noExternal`).
- New primitives follow `packages/ui/AGENTS.md` "Adding a primitive".
