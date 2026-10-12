import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  added_at TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  report TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  tags TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS recipes_source ON recipes(source_id);
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS plans (
  week_start TEXT PRIMARY KEY,
  slots TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ratings (
  recipe_slug TEXT PRIMARY KEY,
  value INTEGER,
  cooked INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS grocery_checks (
  week_start TEXT NOT NULL,
  item_key TEXT NOT NULL,
  PRIMARY KEY (week_start, item_key)
);
`;

let db: Database.Database | undefined;

/** Opens (and creates on first use) the local SQLite file. MEALBUDDY_DB overrides the path. */
export function getDb(): Database.Database {
  if (db) return db;
  const file = process.env.MEALBUDDY_DB ?? path.join(process.cwd(), "data", "mealbuddy.db");
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}
