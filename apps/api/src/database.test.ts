import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase } from "./database";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ouro-db-"));
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
    const path = join(dir, "nested", "test.sqlite");
    const first = appliedIds(path);
    expect(first.length).toBeGreaterThan(0);
    expect(appliedIds(path)).toEqual(first);
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
