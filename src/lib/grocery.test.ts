import { describe, expect, it } from "vitest";
import { buildGroceryList, categoryOf, isStaple, parseIngredient } from "./grocery";
import { makeRecipe } from "./test-helpers";
import type { Plan } from "./types";

describe("parseIngredient", () => {
  it("reads quantity, unit and name", () => {
    expect(parseIngredient("2 tbsp Ghee")).toEqual({ qty: 2, unit: "tbsp", name: "ghee" });
    expect(parseIngredient("3 Idly")).toEqual({ qty: 3, unit: null, name: "idly" });
    expect(parseIngredient("1 1/2 cups Rice")).toEqual({ qty: 1.5, unit: "cup", name: "rice" });
    expect(parseIngredient("½ kg Onions, sliced")).toEqual({ qty: 0.5, unit: "kg", name: "onion" });
    expect(parseIngredient("2 Tomatoes (chopped)")).toEqual({ qty: 2, unit: null, name: "tomato" });
  });
  it("handles items with no quantity", () => {
    expect(parseIngredient("Salt to taste")).toEqual({ qty: null, unit: null, name: "salt" });
    expect(parseIngredient("Curry leaves")).toEqual({ qty: null, unit: null, name: "curry leaves" });
  });
});

describe("categories", () => {
  it("groups common ingredients", () => {
    expect(categoryOf("onion")).toBe("Vegetables and fruits");
    expect(categoryOf("egg")).toBe("Eggs and dairy");
    expect(categoryOf("toor dal")).toBe("Grains, flours and dals");
    expect(categoryOf("red chilli powder")).toBe("Spices and masala");
    expect(isStaple("salt")).toBe(true);
    expect(isStaple("sesame oil")).toBe(true);
    expect(isStaple("onion")).toBe(false);
  });
});

describe("buildGroceryList", () => {
  it("combines ingredients across the week and scales by servings", () => {
    const a = makeRecipe({ name: "Egg Curry", servings: 2, ingredients: ["4 eggs", "200 g onion", "Salt to taste"] });
    const b = makeRecipe({ name: "Egg Dosa", servings: 1, ingredients: ["1 egg", "1 cup dosa batter", "500 g Onion"] });
    const plan: Plan = {
      weekStart: "w",
      slots: [
        { day: 0, meal: "lunch", recipeId: a.id, locked: false, leftover: false },
        { day: 1, meal: "lunch", recipeId: a.id, locked: false, leftover: true },
        { day: 0, meal: "dinner", recipeId: b.id, locked: false, leftover: false },
      ],
    };
    const list = buildGroceryList(plan, new Map([[a.id, a], [b.id, b]]));
    const find = (n: string) => list.find((i) => i.key === n)!;
    expect(find("egg").amount).toBe("5"); // 4 eggs for 2 portions + 1
    expect(find("onion").amount).toBe("700 g");
    expect(find("salt").amount).toBe("");
    expect(find("salt").staple).toBe(true);
    expect(find("dosa batter").amount).toBe("1 cup");
  });

  it("rounds amounts the way a shopper reads them", () => {
    const r = makeRecipe({ name: "Kara Kuzhambu", servings: 3, ingredients: ["10 Shallots", "1 small ball Tamarind", "1/2 cup Rice"] });
    const plan: Plan = { weekStart: "w", slots: [{ day: 0, meal: "lunch", recipeId: r.id, locked: false, leftover: false }] };
    const list = buildGroceryList(plan, new Map([[r.id, r]]));
    const find = (n: string) => list.find((i) => i.key === n)!;
    expect(find("shallot").amount).toBe("4");
    expect(find("tamarind").amount).toBe("¼ ball");
    expect(find("rice").amount).toBe("¼ cup");
  });
});
