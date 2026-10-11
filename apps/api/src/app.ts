import { Elysia } from "elysia";
import { errorBoundary } from "./errors";
import { healthRoutes } from "./health/routes";
import { waitlistRoutes, type WaitlistStore } from "./waitlist/routes";

export type AppDependencies = {
  waitlist: WaitlistStore;
};

/**
 * The whole HTTP surface as a function of its dependencies. `server.ts` and
 * tests supply them through `createStores(db)`; tests call
 * `app.handle(request)` without opening a port. Each feature is one plugin
 * here plus its store in `stores.ts`.
 */
export function createApp(deps: AppDependencies) {
  return new Elysia().use(errorBoundary).use(healthRoutes).use(waitlistRoutes(deps.waitlist));
}

/** The type `apps/web` builds its Eden client from. */
export type App = ReturnType<typeof createApp>;
