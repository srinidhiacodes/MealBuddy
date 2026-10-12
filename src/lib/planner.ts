import { MEALS, type DietClass, type MealType, type Plan, type Profile, type Rating, type Recipe, type Slot } from "./types";

const ALLOWED: Record<Profile["diet"], DietClass[]> = {
  vegan: ["vegan"],
  veg: ["vegan", "veg"],
  egg: ["vegan", "veg", "egg"],
};

const MAX_LEFTOVERS = 2;

export interface PlanOptions {
  weekStart: string;
  seed: number;
  ratings?: Map<number, Rating>;
  /** Slots kept as they are (locked slots always are). */
  existing?: Plan;
  /** Recipes that must not be picked for unlocked slots. */
  exclude?: Set<number>;
}

/** Small seeded random generator so a plan can be reproduced from its seed. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function isAllowed(r: Recipe, profile: Profile, ratings?: Map<number, Rating>): boolean {
  if (!ALLOWED[profile.diet].includes(r.dietClass)) return false;
  if (ratings?.get(r.id) === -1) return false;
  const kitchen = new Set(profile.equipment);
  kitchen.add("stove");
  if (!r.equipment.every((e) => kitchen.has(e))) return false;
  const text = `${r.name} ${r.ingredients.join(" ")}`.toLowerCase();
  if (profile.dislikes.some((d) => d.trim() && text.includes(d.trim().toLowerCase()))) return false;
  return true;
}

function cuisineMatch(r: Recipe, profile: Profile): boolean {
  if (!profile.cuisines.length) return true;
  const c = `${r.cuisine} ${r.keywords}`.toLowerCase();
  return profile.cuisines.some((p) => c.includes(p.toLowerCase()));
}

function score(r: Recipe, profile: Profile, rand: () => number, ratings?: Map<number, Rating>): number {
  let s = rand() * 2;
  if (cuisineMatch(r, profile)) s += 2;
  else if (profile.cuisines.length) s -= 2;
  if (ratings?.get(r.id) === 1) s += 1;
  if (r.spice > profile.spice) s -= 1.5;
  if (r.totalMin !== null && r.totalMin > profile.maxMinutes) s -= 3;
  if (profile.goal === "protein" && r.protein !== null) s += Math.min(r.protein, 30) / 15;
  if (profile.goal === "weight" && r.calories !== null) s -= Math.max(r.calories - 450, 0) / 300;
  return s;
}

function slotAt(plan: Plan | undefined, day: number, meal: MealType): Slot | undefined {
  return plan?.slots.find((s) => s.day === day && s.meal === meal);
}

/**
 * Fills 7 days x 3 meals. Locked slots in `existing` are kept; every other slot
 * gets the best-scoring allowed recipe not used yet this week. A batch-friendly
 * lunch or dinner can carry over as the next day's leftover when there is a fridge.
 */
export function generatePlan(recipes: Recipe[], profile: Profile, opts: PlanOptions): Plan {
  const rand = mulberry32(opts.seed);
  const allowed = recipes.filter((r) => isAllowed(r, profile, opts.ratings));
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const hasFridge = profile.equipment.includes("fridge");

  const slots: Slot[] = [];
  const used = new Set<number>();
  for (const s of opts.existing?.slots ?? []) {
    if (s.locked && s.recipeId !== null) used.add(s.recipeId);
  }
  let leftovers = (opts.existing?.slots ?? []).filter((s) => s.locked && s.leftover).length;

  // Fill one meal across the whole week at a time, breakfast first, so dishes
  // that suit both breakfast and dinner (dosa, idli) are not used up by dinner.
  for (const meal of MEALS) {
    for (let day = 0; day < 7; day++) {
      const prev = slotAt(opts.existing, day, meal);
      if (prev?.locked) {
        slots.push({ ...prev });
        continue;
      }
      const yesterday = slots.find((s) => s.day === day - 1 && s.meal === meal);
      const yRecipe = yesterday?.recipeId != null ? byId.get(yesterday.recipeId) : undefined;
      if (
        meal !== "breakfast" &&
        hasFridge &&
        yRecipe?.batchFriendly &&
        !yesterday!.leftover &&
        leftovers < MAX_LEFTOVERS &&
        !opts.exclude?.has(yRecipe.id)
      ) {
        slots.push({ day, meal, recipeId: yRecipe.id, locked: false, leftover: true });
        leftovers++;
        continue;
      }

      const pool = allowed.filter((r) => r.mealTypes.includes(meal) && !opts.exclude?.has(r.id));
      let candidates = pool.filter((r) => !used.has(r.id));
      if (!candidates.length) candidates = pool; // small library: allow repeats
      let best: Recipe | undefined;
      let bestScore = -Infinity;
      for (const r of candidates) {
        const s = score(r, profile, rand, opts.ratings);
        if (s > bestScore) {
          bestScore = s;
          best = r;
        }
      }
      if (best) used.add(best.id);
      slots.push({ day, meal, recipeId: best?.id ?? null, locked: false, leftover: false });
    }
  }
  slots.sort((a, b) => a.day - b.day || MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal));
  return { weekStart: opts.weekStart, slots };
}

/** Replaces one meal, keeping every other slot as it is. */
export function swapSlot(
  plan: Plan,
  day: number,
  meal: MealType,
  recipes: Recipe[],
  profile: Profile,
  seed: number,
  ratings?: Map<number, Rating>,
): Plan {
  const target = slotAt(plan, day, meal);
  const next = slotAt(plan, day + 1, meal);
  const freeNext = !!(next && next.leftover && !next.locked && next.recipeId === target?.recipeId);
  const frozen: Plan = {
    ...plan,
    slots: plan.slots.map((s) => {
      const isTarget = s.day === day && s.meal === meal;
      const isFreed = freeNext && s.day === day + 1 && s.meal === meal;
      return isTarget || isFreed ? { ...s, locked: false } : { ...s, locked: true };
    }),
  };
  const exclude = new Set<number>(target?.recipeId != null ? [target.recipeId] : []);
  const result = generatePlan(recipes, profile, { weekStart: plan.weekStart, seed, ratings, existing: frozen, exclude });
  // Restore the real lock state of the slots we froze.
  return {
    ...result,
    slots: result.slots.map((s) => {
      const orig = slotAt(plan, s.day, s.meal);
      const changed = (s.day === day || (freeNext && s.day === day + 1)) && s.meal === meal;
      return changed ? { ...s, locked: false } : { ...s, locked: orig?.locked ?? false };
    }),
  };
}

export function toggleLock(plan: Plan, day: number, meal: MealType): Plan {
  return {
    ...plan,
    slots: plan.slots.map((s) => (s.day === day && s.meal === meal ? { ...s, locked: !s.locked } : s)),
  };
}

/** Monday of the week containing `date`, as YYYY-MM-DD in local time. */
export function weekStartOf(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
