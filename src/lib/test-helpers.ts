import { deriveTags } from "./tagging";
import type { Recipe, RecipeInput } from "./types";

let nextId = 1;

/** Builds a tagged recipe for tests with sensible defaults. */
export function makeRecipe(over: Partial<RecipeInput> & { name: string }): Recipe {
  const input: RecipeInput = {
    slug: over.name.toLowerCase().replace(/\s+/g, "-"),
    diet: "Vegetarian",
    cuisine: "Tamil Nadu",
    category: "",
    cookingMethod: "On the Range",
    servings: 2,
    prepMin: 5,
    cookMin: 15,
    totalMin: 20,
    calories: null,
    protein: null,
    fat: null,
    carbs: null,
    fiber: null,
    sugar: null,
    ingredients: ["1 cup rice"],
    steps: ["Cook it"],
    description: "",
    altNames: "",
    keywords: "",
    image: "",
    video: "",
    url: "",
    ...over,
  };
  return { ...input, ...deriveTags(input), id: nextId++, sourceId: 1 };
}
