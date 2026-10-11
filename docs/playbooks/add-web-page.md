# Add a web page

1. **Route**: `apps/web/src/routes/<path>.tsx` with `createFileRoute`. The
   router plugin regenerates `routeTree.gen.ts` on `bun run dev` or build;
   commit it.
2. **Feature**: put the page's sections in `apps/web/src/features/<concept>/`.
   Routes compose features; features do not import each other.
3. **UI**: use `@ouro/ui` primitives. If coss has a component you need that
   `@ouro/ui` lacks, port it first (`packages/ui/AGENTS.md`).
4. **Styles**: `stylex.create` beside the component, values from
   `@ouro/ui/tokens.stylex`.
5. **Head**: set the page's `title` and `description` in the route's `head`.
6. **Test**: add an assertion to `apps/web/test/build/` that the page
   server-renders its key content.
