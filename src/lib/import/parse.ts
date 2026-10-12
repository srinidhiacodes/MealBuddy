import type { RecipeInput } from "../types";

type Field = keyof RecipeInput | "ingredientCount";

/** Accepted column headers (lower-cased, single-spaced) and the field each fills. */
const HEADERS: Record<string, Field> = {
  name: "name",
  title: "name",
  "recipe name": "name",
  slug: "slug",
  diet: "diet",
  cuisine: "cuisine",
  category: "category",
  "cooking method": "cookingMethod",
  servings: "servings",
  "prep (min)": "prepMin",
  "prep time": "prepMin",
  "cook (min)": "cookMin",
  "cook time": "cookMin",
  "total (min)": "totalMin",
  "total time": "totalMin",
  "calories (kcal)": "calories",
  calories: "calories",
  "protein (g)": "protein",
  "fat (g)": "fat",
  "carbs (g)": "carbs",
  "fiber (g)": "fiber",
  "sugar (g)": "sugar",
  "ingredient count": "ingredientCount",
  ingredients: "ingredients",
  steps: "steps",
  instructions: "steps",
  method: "steps",
  description: "description",
  "alternate names": "altNames",
  keywords: "keywords",
  image: "image",
  video: "video",
  url: "url",
};

export const REQUIRED_FIELDS: Field[] = ["name", "ingredients", "steps"];

export interface SkippedRow {
  row: number; // 1-based spreadsheet row number, header = 1
  name: string;
  reason: string;
}

export interface ImportReport {
  totalRows: number;
  added: number;
  duplicates: number;
  skipped: SkippedRow[];
  unknownColumns: string[];
  missingColumns: string[];
}

export interface ParseResult {
  recipes: RecipeInput[];
  report: ImportReport;
}

function normaliseHeader(h: unknown): string {
  return String(h ?? "")
    .replace(/^﻿/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function text(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

export function toNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const m = text(v).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

const NUMBERING = /^\s*(?:step\s*)?\d+\s*[.):-]\s*/i;

/**
 * Splits an Ingredients or Steps cell into items. Accepts a JSON array,
 * one item per line, or items separated by | or ;. Commas are only used
 * when the expected count says the cell holds several items.
 */
export function splitList(value: unknown, expectedCount?: number | null): string[] {
  const raw = text(value);
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.map((x) => text(x)).filter(Boolean);
    } catch {
      // not JSON, fall through
    }
  }
  let parts: string[] = [raw];
  for (const sep of [/\r?\n/, /\s*\|\s*/, /\s*;\s*/]) {
    const p = raw.split(sep);
    if (p.length > 1) {
      parts = p;
      break;
    }
  }
  if (parts.length === 1 && expectedCount && expectedCount > 1) {
    const p = raw.split(/\s*,\s*/);
    if (p.length > 1) parts = p;
  }
  return parts.map((p) => p.replace(NUMBERING, "").trim()).filter(Boolean);
}

/** Turns spreadsheet rows (header row first) into recipes plus an import report. */
export function parseRows(rows: unknown[][]): ParseResult {
  const report: ImportReport = {
    totalRows: 0,
    added: 0,
    duplicates: 0,
    skipped: [],
    unknownColumns: [],
    missingColumns: [],
  };
  const headerIndex = rows.findIndex((r) => r.some((c) => text(c) !== ""));
  if (headerIndex === -1) {
    report.missingColumns = ["Name", "Ingredients", "Steps"];
    return { recipes: [], report };
  }

  const header = rows[headerIndex].map(normaliseHeader);
  const columns: Partial<Record<Field, number>> = {};
  header.forEach((h, i) => {
    if (!h) return;
    const field = HEADERS[h];
    if (field && columns[field] === undefined) columns[field] = i;
    else if (!field) report.unknownColumns.push(String(rows[headerIndex][i]).trim());
  });
  const missing = REQUIRED_FIELDS.filter((f) => columns[f] === undefined);
  if (missing.length) {
    report.missingColumns = missing.map((f) => f[0].toUpperCase() + f.slice(1));
    return { recipes: [], report };
  }

  const get = (row: unknown[], f: Field) => {
    const i = columns[f];
    return i === undefined ? "" : row[i];
  };

  const recipes: RecipeInput[] = [];
  const seen = new Set<string>();
  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => text(c) === "")) continue;
    report.totalRows++;
    const rowNumber = r + 1;
    const name = text(get(row, "name"));
    const count = toNumber(get(row, "ingredientCount"));
    const ingredients = splitList(get(row, "ingredients"), count);
    const steps = splitList(get(row, "steps"));
    if (!name) {
      report.skipped.push({ row: rowNumber, name: "", reason: "no Name" });
      continue;
    }
    if (!ingredients.length) {
      report.skipped.push({ row: rowNumber, name, reason: "no Ingredients" });
      continue;
    }
    if (!steps.length) {
      report.skipped.push({ row: rowNumber, name, reason: "no Steps" });
      continue;
    }
    const slug = slugify(text(get(row, "slug")) || name);
    if (seen.has(slug)) {
      report.duplicates++;
      continue;
    }
    seen.add(slug);

    const prepMin = toNumber(get(row, "prepMin"));
    const cookMin = toNumber(get(row, "cookMin"));
    let totalMin = toNumber(get(row, "totalMin"));
    if (totalMin === null && (prepMin !== null || cookMin !== null)) {
      totalMin = (prepMin ?? 0) + (cookMin ?? 0);
    }

    recipes.push({
      slug,
      name,
      diet: text(get(row, "diet")),
      cuisine: text(get(row, "cuisine")),
      category: text(get(row, "category")),
      cookingMethod: text(get(row, "cookingMethod")),
      servings: toNumber(get(row, "servings")),
      prepMin,
      cookMin,
      totalMin,
      calories: toNumber(get(row, "calories")),
      protein: toNumber(get(row, "protein")),
      fat: toNumber(get(row, "fat")),
      carbs: toNumber(get(row, "carbs")),
      fiber: toNumber(get(row, "fiber")),
      sugar: toNumber(get(row, "sugar")),
      ingredients,
      steps,
      description: text(get(row, "description")),
      altNames: text(get(row, "altNames")),
      keywords: text(get(row, "keywords")),
      image: text(get(row, "image")),
      video: text(get(row, "video")),
      url: text(get(row, "url")),
    });
  }
  report.added = recipes.length;
  return { recipes, report };
}
