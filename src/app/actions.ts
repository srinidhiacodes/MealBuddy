"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fileKind, readRecipeFile } from "@/lib/import/read";
import type { ImportReport } from "@/lib/import/parse";
import { generatePlan, swapSlot, toggleLock, weekStartOf } from "@/lib/planner";
import * as repo from "@/lib/repo";
import type { Equipment, Goal, MealType, Profile, Rating, Spice } from "@/lib/types";
import { MEALS } from "@/lib/types";

function newSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

function refreshAll() {
  revalidatePath("/", "layout");
}

// ---- Recipe files ----

export interface UploadResult {
  files: { name: string; report?: ImportReport; error?: string }[];
}

export async function uploadRecipes(_prev: UploadResult | null, form: FormData): Promise<UploadResult> {
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const result: UploadResult = { files: [] };
  for (const file of files) {
    const kind = fileKind(file.name);
    if (!kind) {
      result.files.push({ name: file.name, error: "Only .csv and .xlsx files are supported" });
      continue;
    }
    try {
      const { recipes, report } = await readRecipeFile(file.name, Buffer.from(await file.arrayBuffer()));
      if (report.missingColumns.length) {
        result.files.push({ name: file.name, report, error: `Missing columns: ${report.missingColumns.join(", ")}` });
        continue;
      }
      repo.addSource(file.name, kind, recipes, report);
      result.files.push({ name: file.name, report });
    } catch (e) {
      result.files.push({ name: file.name, error: e instanceof Error ? e.message : "Could not read this file" });
    }
  }
  refreshAll();
  return result;
}

export async function toggleSource(id: number, enabled: boolean) {
  repo.setSourceEnabled(id, enabled);
  refreshAll();
}

export async function removeSource(id: number) {
  repo.deleteSource(id);
  refreshAll();
}

// ---- Profile ----

const EQUIPMENT: Equipment[] = ["stove", "pressure_cooker", "mixie", "microwave", "oven", "air_fryer", "kettle", "fridge"];

export async function saveProfile(form: FormData) {
  const diet = String(form.get("diet"));
  const goal = String(form.get("goal"));
  const profile: Profile = {
    diet: diet === "veg" || diet === "vegan" ? diet : "egg",
    cuisines: form.getAll("cuisines").map(String).filter(Boolean),
    spice: (Math.min(3, Math.max(1, Number(form.get("spice")) || 2)) as Spice),
    maxMinutes: Math.max(10, Number(form.get("maxMinutes")) || 30),
    equipment: form.getAll("equipment").map(String).filter((e): e is Equipment => EQUIPMENT.includes(e as Equipment)),
    dislikes: String(form.get("dislikes") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    goal: (["healthy", "protein", "weight"].includes(goal) ? goal : "healthy") as Goal,
  };
  repo.saveProfile(profile);
  if (form.get("replan") === "1") {
    replanWeek();
    refreshAll();
    redirect("/");
  }
  refreshAll();
}

// ---- Weekly plan ----

function currentWeek() {
  return weekStartOf(new Date());
}

/** Plans the whole week again, keeping locked meals. */
function replanWeek() {
  const weekStart = currentWeek();
  const recipes = repo.listActiveRecipes();
  const plan = generatePlan(recipes, repo.getProfile(), {
    weekStart,
    seed: newSeed(),
    ratings: repo.getRatings(recipes),
    existing: repo.getPlan(weekStart),
  });
  repo.savePlan(plan);
}

export async function planWeek() {
  replanWeek();
  refreshAll();
}

function parseSlot(day: number, meal: string): { day: number; meal: MealType } {
  if (!Number.isInteger(day) || day < 0 || day > 6 || !MEALS.includes(meal as MealType)) {
    throw new Error("Unknown meal slot");
  }
  return { day, meal: meal as MealType };
}

export async function lockMeal(day: number, meal: string) {
  const slot = parseSlot(day, meal);
  const plan = repo.getPlan(currentWeek());
  if (!plan) return;
  repo.savePlan(toggleLock(plan, slot.day, slot.meal));
  refreshAll();
}

export async function swapMeal(day: number, meal: string) {
  const slot = parseSlot(day, meal);
  const plan = repo.getPlan(currentWeek());
  if (!plan) return;
  const recipes = repo.listActiveRecipes();
  repo.savePlan(swapSlot(plan, slot.day, slot.meal, recipes, repo.getProfile(), newSeed(), repo.getRatings(recipes)));
  refreshAll();
}

// ---- Ratings ----

export async function rateRecipe(slug: string, value: Rating | null) {
  repo.setRating(slug, value);
  refreshAll();
}

export async function cookedRecipe(slug: string) {
  repo.markCooked(slug);
  refreshAll();
}

// ---- Grocery ----

export async function checkGroceryItem(weekStart: string, key: string, checked: boolean) {
  repo.setGroceryCheck(weekStart, key, checked);
  revalidatePath("/grocery");
}
