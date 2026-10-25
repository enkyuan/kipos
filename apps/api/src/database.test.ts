import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase } from "./database";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "kipos-db-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const appliedIds = (path: string, migrations?: string) => {
  const db = openDatabase(path, migrations);
  const ids = db.query<{ id: string }, []>("SELECT id FROM schema_migrations").all();
  db.close();
  return ids.map((row) => row.id);
};

describe("openDatabase", () => {
  test("applies each migration once, even across reopen", () => {
    const migrations = join(dir, "migrations");
    const path = join(dir, "nested", "test.sqlite");
    mkdirSync(migrations);
    writeFileSync(join(migrations, "001_first.sql"), "CREATE TABLE first (x INTEGER);");
    expect(appliedIds(path, migrations)).toEqual(["001_first.sql"]);
    writeFileSync(join(migrations, "002_second.sql"), "CREATE TABLE second (x INTEGER);");
    expect(appliedIds(path, migrations)).toEqual(["001_first.sql", "002_second.sql"]);
  });

  // Value: protects=the shipped migrations directory exists (git keeps it only through .gitkeep) and applies exactly its .sql files; fails_when=the directory is missing on a fresh clone or a non-SQL file is run as a migration; why_new=every other case injects its own directory; seam=none; no_claim=none beyond protects
  test("opens against the shipped migrations directory and ignores files that are not .sql", () => {
    const shippedDir = join(import.meta.dir, "../migrations");
    const db = openDatabase(":memory:");
    const shipped = db.query<{ id: string }, []>("SELECT id FROM schema_migrations").all();
    db.close();
    expect(shipped.map((row) => row.id)).toEqual(
      readdirSync(shippedDir)
        .filter((file) => file.endsWith(".sql"))
        .sort(),
    );

    const migrations = join(dir, "migrations");
    mkdirSync(migrations);
    writeFileSync(join(migrations, ".gitkeep"), "");
    writeFileSync(join(migrations, "notes.txt"), "not sql");
    writeFileSync(join(migrations, "001_only.sql"), "CREATE TABLE only_one (x INTEGER);");
    expect(appliedIds(join(dir, "test.sqlite"), migrations)).toEqual(["001_only.sql"]);
  });

  test("rolls back a failing migration entirely and does not record it", () => {
    const migrations = join(dir, "migrations");
    const path = join(dir, "test.sqlite");
    mkdirSync(migrations);
    writeFileSync(join(migrations, "001_ok.sql"), "CREATE TABLE ok (x INTEGER);");
    writeFileSync(
      join(migrations, "002_broken.sql"),
      "CREATE TABLE half (x INTEGER); INSERT INTO missing VALUES (1);",
    );

    expect(() => openDatabase(path, migrations)).toThrow();

    writeFileSync(join(migrations, "002_broken.sql"), "SELECT 1;");
    const db = openDatabase(path, migrations);
    const tables = db
      .query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row) => row.name);
    db.close();
    // 001 committed on the first open; 002's first statement did not survive.
    expect(tables).toContain("ok");
    expect(tables).not.toContain("half");
  });
});
