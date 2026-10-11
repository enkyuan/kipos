import type { Database } from "bun:sqlite";
import type { AppDependencies } from "./app";
import { createWaitlistStore } from "./waitlist/store";

/**
 * Every feature's real store over one database. `server.ts` and the tests
 * both build the app from this, so a new feature is wired in one place and
 * existing tests keep compiling.
 */
export function createStores(db: Database): AppDependencies {
  return {
    waitlist: createWaitlistStore(db),
  };
}
