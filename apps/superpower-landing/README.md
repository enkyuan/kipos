# Superpower landing

A standalone, static landing page implementing the "Superpower Landing v3"
design from the claude.ai/design project "Landing page design brief". It is
intentionally separate from `apps/web`: a single self-contained `index.html`
with no build step, no framework, and no shared code — deployable to any
static host as-is.

The source design (`Superpower Landing v3.dc.html`) runs on the dc-runtime
(React). This port reimplements its behavior in vanilla JS:

- hero terminal autoplay through four steps (scope → build → ship → learn),
  with clickable step rails and progress bars
- copy-to-clipboard install command
- scroll-driven "how it works" panel switching (IntersectionObserver)
- reveal-on-scroll animations
- auto-rotating "where it lives" surface switcher, pinnable by click

Animations are disabled under `prefers-reduced-motion`.

View it by opening `index.html` directly, or:

```bash
bunx serve apps/superpower-landing
```
