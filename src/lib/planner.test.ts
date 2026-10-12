import { describe, expect, it } from "vitest";
import { generatePlan, isAllowed, swapSlot, toggleLock, weekStartOf } from "./planner";
import { makeRecipe } from "./test-helpers";
import { DEFAULT_PROFILE, type Profile } from "./types";

const breakfasts = ["Idli", "Ven Pongal", "Rava Upma", "Masala Dosa", "Aval Upma", "Ragi Dosa", "Pesarattu", "Appam"].map((n) =>
  makeRecipe({ name: n, category: "Tiffin" }),
);
const mains = ["Sambar Rice", "Lemon Rice", "Curd Rice", "Tomato Rice", "Coconut Rice", "Veg Biryani", "Rasam Rice", "Egg Curry", "Chana Masala"].map(
  (n) => makeRecipe({ name: n, category: "Rice, Curries", ingredients: n.startsWith("Egg") ? ["2 eggs"] : ["1 cup rice"] }),
);
const chicken = makeRecipe({ name: "Chicken Curry", category: "Curries", diet: "Non-Vegetarian" });
const all = [...breakfasts, ...mains, chicken];
const noFridge: Profile = { ...DEFAULT_PROFILE, equipment: ["stove", "pressure_cooker"] };

describe("generatePlan", () => {
  it("fills all 21 slots and never picks meat for an eggetarian", () => {
    const plan = generatePlan(all, DEFAULT_PROFILE, { weekStart: "2026-10-12", seed: 1 });
    expect(plan.slots).toHaveLength(21);
    expect(plan.slots.every((s) => s.recipeId !== null)).toBe(true);
    expect(plan.slots.some((s) => s.recipeId === chicken.id)).toBe(false);
  });

  it("does not repeat a recipe in the week unless it is a leftover", () => {
    const plan = generatePlan(all, noFridge, { weekStart: "2026-10-12", seed: 7 });
    const breakfastIds = plan.slots.filter((s) => s.meal === "breakfast").map((s) => s.recipeId);
    expect(new Set(breakfastIds).size).toBe(7);
  });

  it("plans at most two leftovers, only with a fridge", () => {
    const withFridge = generatePlan(all, DEFAULT_PROFILE, { weekStart: "2026-10-12", seed: 3 });
    const without = generatePlan(all, noFridge, { weekStart: "2026-10-12", seed: 3 });
    expect(withFridge.slots.filter((s) => s.leftover).length).toBeLessThanOrEqual(2);
    expect(without.slots.filter((s) => s.leftover).length).toBe(0);
  });

  it("is reproducible from its seed", () => {
    const a = generatePlan(all, DEFAULT_PROFILE, { weekStart: "w", seed: 42 });
    const b = generatePlan(all, DEFAULT_PROFILE, { weekStart: "w", seed: 42 });
    expect(a).toEqual(b);
  });

  it("keeps locked slots when shuffling", () => {
    const first = generatePlan(all, noFridge, { weekStart: "w", seed: 1 });
    const locked = toggleLock(first, 2, "lunch");
    const lockedId = locked.slots.find((s) => s.day === 2 && s.meal === "lunch")!.recipeId;
    for (const seed of [2, 3, 4, 5]) {
      const next = generatePlan(all, noFridge, { weekStart: "w", seed, existing: locked });
      expect(next.slots.find((s) => s.day === 2 && s.meal === "lunch")!.recipeId).toBe(lockedId);
    }
  });

  it("leaves a slot empty when nothing fits", () => {
    const plan = generatePlan(breakfasts, DEFAULT_PROFILE, { weekStart: "w", seed: 1 });
    expect(plan.slots.filter((s) => s.meal === "lunch").every((s) => s.recipeId === null)).toBe(true);
  });
});

describe("isAllowed", () => {
  it("respects dislikes, equipment and 'not again' ratings", () => {
    const brinjal = makeRecipe({ name: "Brinjal Curry", category: "Curries", ingredients: ["2 brinjal"] });
    const baked = makeRecipe({ name: "Baked Pasta", category: "Dinner", steps: ["Bake in the oven"] });
    expect(isAllowed(brinjal, { ...DEFAULT_PROFILE, dislikes: ["Brinjal"] })).toBe(false);
    expect(isAllowed(baked, DEFAULT_PROFILE)).toBe(false);
    expect(isAllowed(baked, { ...DEFAULT_PROFILE, equipment: ["oven"] })).toBe(true);
    expect(isAllowed(brinjal, DEFAULT_PROFILE, new Map([[brinjal.id, -1]]))).toBe(false);
  });
  it("hides egg dishes from vegetarians", () => {
    const egg = mains.find((r) => r.name === "Egg Curry")!;
    expect(isAllowed(egg, { ...DEFAULT_PROFILE, diet: "veg" })).toBe(false);
  });
});

describe("swapSlot", () => {
  it("changes only the chosen meal", () => {
    const plan = generatePlan(all, noFridge, { weekStart: "w", seed: 9 });
    const swapped = swapSlot(plan, 3, "dinner", all, noFridge, 99);
    const before = plan.slots.find((s) => s.day === 3 && s.meal === "dinner")!.recipeId;
    const after = swapped.slots.find((s) => s.day === 3 && s.meal === "dinner")!.recipeId;
    expect(after).not.toBe(before);
    const others = (p: typeof plan) => p.slots.filter((s) => !(s.day === 3 && s.meal === "dinner")).map((s) => s.recipeId);
    expect(others(swapped)).toEqual(others(plan));
  });
});

describe("weekStartOf", () => {
  it("returns the Monday", () => {
    expect(weekStartOf(new Date(2026, 9, 14))).toBe("2026-10-12"); // Wednesday
    expect(weekStartOf(new Date(2026, 9, 18))).toBe("2026-10-12"); // Sunday
  });
});
