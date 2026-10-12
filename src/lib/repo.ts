import { getDb } from "./db";
import type { ImportReport } from "./import/parse";
import { deriveTags } from "./tagging";
import { DEFAULT_PROFILE, type Plan, type Profile, type Rating, type Recipe, type RecipeInput, type RecipeTags } from "./types";

export interface Source {
  id: number;
  name: string;
  kind: string;
  addedAt: string;
  enabled: boolean;
  report: ImportReport;
  recipeCount: number;
}

interface RecipeRow {
  id: number;
  source_id: number;
  data: string;
  tags: string;
}

function toRecipe(row: RecipeRow): Recipe {
  return {
    ...(JSON.parse(row.data) as RecipeInput),
    ...(JSON.parse(row.tags) as RecipeTags),
    id: row.id,
    sourceId: row.source_id,
  };
}

// ---- Sources and recipes ----

export function addSource(name: string, kind: string, recipes: RecipeInput[], report: ImportReport): number {
  const db = getDb();
  const insertSource = db.prepare(
    "INSERT INTO sources (name, kind, added_at, enabled, report) VALUES (?, ?, ?, 1, ?)",
  );
  const insertRecipe = db.prepare(
    "INSERT INTO recipes (source_id, slug, name, data, tags) VALUES (?, ?, ?, ?, ?)",
  );
  return db.transaction(() => {
    const { lastInsertRowid } = insertSource.run(name, kind, new Date().toISOString(), JSON.stringify(report));
    const id = Number(lastInsertRowid);
    for (const r of recipes) {
      insertRecipe.run(id, r.slug, r.name, JSON.stringify(r), JSON.stringify(deriveTags(r)));
    }
    return id;
  })();
}

export function listSources(): Source[] {
  const rows = getDb()
    .prepare(
      `SELECT s.*, (SELECT COUNT(*) FROM recipes r WHERE r.source_id = s.id) AS recipe_count
       FROM sources s ORDER BY s.id DESC`,
    )
    .all() as { id: number; name: string; kind: string; added_at: string; enabled: number; report: string; recipe_count: number }[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    kind: r.kind,
    addedAt: r.added_at,
    enabled: r.enabled === 1,
    report: JSON.parse(r.report),
    recipeCount: r.recipe_count,
  }));
}

export function setSourceEnabled(id: number, enabled: boolean) {
  getDb().prepare("UPDATE sources SET enabled = ? WHERE id = ?").run(enabled ? 1 : 0, id);
}

export function deleteSource(id: number) {
  getDb().prepare("DELETE FROM sources WHERE id = ?").run(id);
}

/** Recipes from switched-on files. When two files share a slug, the newer file wins. */
export function listActiveRecipes(): Recipe[] {
  const rows = getDb()
    .prepare(
      `SELECT r.id, r.source_id, r.data, r.tags FROM recipes r
       JOIN sources s ON s.id = r.source_id WHERE s.enabled = 1
       ORDER BY s.id DESC, r.id`,
    )
    .all() as RecipeRow[];
  const seen = new Set<string>();
  const out: Recipe[] = [];
  for (const row of rows) {
    const r = toRecipe(row);
    if (seen.has(r.slug)) continue;
    seen.add(r.slug);
    out.push(r);
  }
  return out;
}

export function getRecipe(id: number): Recipe | undefined {
  const row = getDb().prepare("SELECT id, source_id, data, tags FROM recipes WHERE id = ?").get(id) as
    | RecipeRow
    | undefined;
  return row ? toRecipe(row) : undefined;
}

export function getRecipesByIds(ids: number[]): Map<number, Recipe> {
  const out = new Map<number, Recipe>();
  if (!ids.length) return out;
  const unique = [...new Set(ids)];
  const rows = getDb()
    .prepare(`SELECT id, source_id, data, tags FROM recipes WHERE id IN (${unique.map(() => "?").join(",")})`)
    .all(...unique) as RecipeRow[];
  for (const row of rows) out.set(row.id, toRecipe(row));
  return out;
}

// ---- Profile ----

export function getProfile(): Profile {
  const row = getDb().prepare("SELECT data FROM profile WHERE id = 1").get() as { data: string } | undefined;
  return row ? { ...DEFAULT_PROFILE, ...JSON.parse(row.data) } : DEFAULT_PROFILE;
}

export function hasProfile(): boolean {
  return !!getDb().prepare("SELECT 1 FROM profile WHERE id = 1").get();
}

export function saveProfile(p: Profile) {
  getDb()
    .prepare("INSERT INTO profile (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data")
    .run(JSON.stringify(p));
}

// ---- Plans ----

export function getPlan(weekStart: string): Plan | undefined {
  const row = getDb().prepare("SELECT slots FROM plans WHERE week_start = ?").get(weekStart) as
    | { slots: string }
    | undefined;
  return row ? { weekStart, slots: JSON.parse(row.slots) } : undefined;
}

export function savePlan(plan: Plan) {
  getDb()
    .prepare(
      "INSERT INTO plans (week_start, slots) VALUES (?, ?) ON CONFLICT(week_start) DO UPDATE SET slots = excluded.slots",
    )
    .run(plan.weekStart, JSON.stringify(plan.slots));
}

// ---- Ratings (kept by slug so they survive re-importing a file) ----

export function getRatings(recipes: Recipe[]): Map<number, Rating> {
  const rows = getDb().prepare("SELECT recipe_slug, value FROM ratings WHERE value IS NOT NULL").all() as {
    recipe_slug: string;
    value: Rating;
  }[];
  const bySlug = new Map(rows.map((r) => [r.recipe_slug, r.value]));
  const out = new Map<number, Rating>();
  for (const r of recipes) {
    const v = bySlug.get(r.slug);
    if (v) out.set(r.id, v);
  }
  return out;
}

export function getRating(slug: string): { value: Rating | null; cooked: number } {
  const row = getDb().prepare("SELECT value, cooked FROM ratings WHERE recipe_slug = ?").get(slug) as
    | { value: Rating | null; cooked: number }
    | undefined;
  return row ?? { value: null, cooked: 0 };
}

export function setRating(slug: string, value: Rating | null) {
  getDb()
    .prepare(
      "INSERT INTO ratings (recipe_slug, value) VALUES (?, ?) ON CONFLICT(recipe_slug) DO UPDATE SET value = excluded.value",
    )
    .run(slug, value);
}

export function markCooked(slug: string) {
  getDb()
    .prepare(
      "INSERT INTO ratings (recipe_slug, cooked) VALUES (?, 1) ON CONFLICT(recipe_slug) DO UPDATE SET cooked = cooked + 1",
    )
    .run(slug);
}

// ---- Grocery ticks ----

export function getGroceryChecks(weekStart: string): Set<string> {
  const rows = getDb().prepare("SELECT item_key FROM grocery_checks WHERE week_start = ?").all(weekStart) as {
    item_key: string;
  }[];
  return new Set(rows.map((r) => r.item_key));
}

export function setGroceryCheck(weekStart: string, key: string, checked: boolean) {
  const db = getDb();
  if (checked) {
    db.prepare("INSERT OR IGNORE INTO grocery_checks (week_start, item_key) VALUES (?, ?)").run(weekStart, key);
  } else {
    db.prepare("DELETE FROM grocery_checks WHERE week_start = ? AND item_key = ?").run(weekStart, key);
  }
}
