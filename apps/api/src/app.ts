import { Elysia } from "elysia";
import { errorBoundary } from "./errors";
import { healthRoutes } from "./health/routes";

/**
 * The whole HTTP surface. `server.ts` and tests build it; tests call
 * `app.handle(request)` without opening a port. A feature joins as one
 * plugin here; when one needs storage or a provider, it takes them as
 * arguments (`createApp(deps)`), supplied by `server.ts` and by tests.
 */
export function createApp() {
  return new Elysia().use(errorBoundary).use(healthRoutes);
}

/** The type `apps/web` builds its Eden client from. */
export type App = ReturnType<typeof createApp>;
