# 0005 — Motion for enter/exit (presence) animations

Status: superseded by 0007-base-ui-design-kit.md (2026-10-11)

## Context

The meeting link's copy button swaps its copy icon for a check, then back.
The swap should blur-fade: the leaving icon shrinks, blurs and fades while
the arriving one does the reverse, and a second click mid-swap must retarget
smoothly. CSS can only do this by keeping both icons mounted and stacked,
which is what the first version did; the person asked for `motion`.

## Decision

`apps/web` uses `motion` (`motion/react`, pinned exactly) for presence
animations: an element that mounts and unmounts with an animation
(`AnimatePresence`). Values follow the interface-polish rules: scale
0.25 → 1, opacity 0 → 1, blur 4px → 0, a spring of 0.3 s with no bounce,
`initial={false}` so nothing animates on first render, and
`MotionConfig reducedMotion="user"` so reduced motion keeps the fade and
drops the scale.

Everything else (hover, press, dialogs, focus) stays CSS through StyleX:
those are state transitions, which CSS interrupts well, and they run off
the main thread.

## Consequences

- One runtime dependency in `apps/web` only; `packages/ui` stays free of it.
- Motion drives values from `requestAnimationFrame`: in a hidden tab the
  swap does not advance until the tab is visible. Verify motion in a
  visible browser.
