import type { Database } from "bun:sqlite";
import type { WaitlistStore } from "./routes";

/** The SQLite-backed waitlist. The table's primary key enforces one row per email. */
export function createWaitlistStore(db: Database): WaitlistStore {
  const insert = db.query<void, [string, string]>(
    "INSERT INTO waitlist_entries (email, joined_at) VALUES (?, ?) ON CONFLICT (email) DO NOTHING",
  );
  return {
    join(email) {
      insert.run(email, new Date().toISOString());
    },
  };
}
