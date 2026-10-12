import { lazy, Suspense, useSyncExternalStore } from "react";

// Design tooling for the running app, development only: Vite replaces
// `import.meta.env.DEV` with false in builds, so these imports (and their
// packages and stylesheets) drop out of production bundles.
// - Agentation: click any element to leave an annotation an agent can act on.
// - DialKit: the panel that shows every `useDialKit` control on the page.
const Agentation = import.meta.env.DEV
  ? lazy(() => import("agentation").then((module) => ({ default: module.Agentation })))
  : null;
const DialRoot = import.meta.env.DEV
  ? lazy(async () => {
      await import("dialkit/styles.css");
      return import("dialkit").then((module) => ({ default: module.DialRoot }));
    })
  : null;

/** The development toolbars, mounted in the browser only (they read the live DOM). */
export function DevTools() {
  // false while server rendering and hydrating, true in the browser after.
  const inBrowser = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!Agentation || !DialRoot || !inBrowser) return null;
  return (
    <Suspense fallback={null}>
      <Agentation />
      <DialRoot />
    </Suspense>
  );
}
