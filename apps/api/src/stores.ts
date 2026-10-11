import type { Database } from "bun:sqlite";
import { createAnalysisStore } from "./analysis/store";
import type { AppDependencies } from "./app";
import { createDeliveryInbox, createMeetingStore } from "./meetings/store";

/**
 * Every feature's real store over one database. `server.ts` and the tests
 * both build the app from this, so a new feature is wired in one place and
 * existing tests keep compiling.
 */
export function createStores(db: Database) {
  return {
    meetings: createMeetingStore(db),
    inbox: createDeliveryInbox(db),
    analysisStore: createAnalysisStore(db),
  } satisfies Pick<AppDependencies, "meetings" | "inbox" | "analysisStore">;
}
