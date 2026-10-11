import { lazy, Suspense, useSyncExternalStore } from "react";

// Agentation: click any element in the running app to leave an annotation
// an agent can act on. Development only: Vite replaces
// `import.meta.env.DEV` with false in builds, so the import (and the
// package) drop out of production bundles.
const Agentation = import.meta.env.DEV
  ? lazy(() => import("agentation").then((module) => ({ default: module.Agentation })))
  : null;

/** The annotation toolbar, mounted in the browser only (it reads the live DOM). */
export function DevAnnotations() {
  // false while server rendering and hydrating, true in the browser after.
  const inBrowser = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!Agentation || !inBrowser) return null;
  return (
    <Suspense fallback={null}>
      <Agentation />
    </Suspense>
  );
}
