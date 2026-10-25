import { Elysia } from "elysia";
import { errorBoundary } from "./errors";
import { healthRoutes } from "./health/routes";

/**
 * The whole HTTP surface. `server.ts` and tests call it; tests use
 * `app.handle(request)` without opening a port. A feature is one plugin
 * here; once it needs storage or an external service, `createApp` takes
 * them as arguments.
 */
export function createApp() {
  return new Elysia().use(errorBoundary).use(healthRoutes);
}

/** The type the Eden client in `apps/web` is built from, once it has a first API call. */
export type App = ReturnType<typeof createApp>;
