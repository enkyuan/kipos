# Scaffold review fixes

State: DONE
Branch: main (uncommitted)
Base SHA: none
Head SHA: uncommitted
Completed: 2026-10-11

## Goal

Resolve the independent modularity review of the initial scaffold.

## Changed

- Cross-feature imports are now lint errors in both apps; the landing hero
  takes the waitlist form as `children` from the route.
- Error boundary: response-schema failures are 500, thrown
  `status(code, apiError())` keeps its status; `apiErrorSchema` is exported
  and declared for the waitlist 422, so the web client's 422 check is typed.
- `createStores(db)` wires every feature's store once, for the server and
  tests alike.
- `readEnv` rejects `""`, `0`, hex and exponent ports.
- An outage no longer marks a valid email invalid; it shows its own alert.
- Button hover sits under `media.hover` (as Tailwind's `hover:`); focus ring
  uses the shadow tokens; spinner slows under reduced motion.
- Footer year removed (hydration risk); the landing route sets its own head.
- Structure check: only `src/api/client.ts` may import `@ouro/api`, types
  only, across multi-line and dynamic imports; bare `bun` blocked in web.
- Migration rollback is now proven by a test.

## Verification

`bun run verify` passes (API 14, ui 2, web SSR 3, structure 6). Each new
guard was proven by a temporary violation.

## Not changed

Token scale steps nobody uses yet (`fontSize.xxxl` is now used; `font.mono`,
`lineHeight.base`) stay: they are the design vocabulary, not dead code.
