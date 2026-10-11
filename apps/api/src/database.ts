import { Database } from "bun:sqlite";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const MIGRATIONS_DIR = join(import.meta.dir, "../migrations");

/**
 * Opens the SQLite database at `path` (`:memory:` for tests) and applies any
 * pending migrations from `apps/api/migrations/` (or `migrationsDir`), in
 * filename order.
 */
export function openDatabase(path: string, migrationsDir = MIGRATIONS_DIR): Database {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new Database(path, { create: true, strict: true });
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA foreign_keys = ON");
  // A second process (a test, a one-off script) waits for the lock instead
  // of failing immediately with SQLITE_BUSY.
  db.run("PRAGMA busy_timeout = 5000");
  applyMigrations(db, migrationsDir);
  return db;
}

function applyMigrations(db: Database, dir: string): void {
  db.run(
    "CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
  );
  const applied = new Set(
    db
      .query<{ id: string }, []>("SELECT id FROM schema_migrations")
      .all()
      .map((row) => row.id),
  );
  const pending = readdirSync(dir)
    .filter((file) => file.endsWith(".sql") && !applied.has(file))
    .sort();

  for (const file of pending) {
    const sql = readFileSync(join(dir, file), "utf8");
    // The migration and its record commit together, so a crash can never
    // leave a migration applied but unrecorded (and re-run on next start).
    db.transaction(() => {
      db.run(sql);
      db.run("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)", [
        file,
        new Date().toISOString(),
      ]);
    })();
  }
}
