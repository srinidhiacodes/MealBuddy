export type DietClass = "vegan" | "veg" | "egg" | "nonveg";
export type DietPreference = "vegan" | "veg" | "egg";
export type MealType = "breakfast" | "lunch" | "dinner";
export type Equipment =
  | "stove"
  | "pressure_cooker"
  | "mixie"
  | "microwave"
  | "oven"
  | "air_fryer"
  | "kettle"
  | "fridge";
export type Spice = 1 | 2 | 3;
export type Goal = "healthy" | "protein" | "weight";

export const MEALS: MealType[] = ["breakfast", "lunch", "dinner"];

/** One recipe as read from an uploaded CSV/XLSX row. */
export interface RecipeInput {
  slug: string;
  name: string;
  diet: string;
  cuisine: string;
  category: string;
  cookingMethod: string;
  servings: number | null;
  prepMin: number | null;
  cookMin: number | null;
  totalMin: number | null;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  fiber: number | null;
  sugar: number | null;
  ingredients: string[];
  steps: string[];
  description: string;
  altNames: string;
  keywords: string;
  image: string;
  video: string;
  url: string;
}

/** Planning tags derived from a recipe's columns. */
export interface RecipeTags {
  dietClass: DietClass;
  mealTypes: MealType[];
  equipment: Equipment[];
  spice: Spice;
  batchFriendly: boolean;
}

export interface Recipe extends RecipeInput, RecipeTags {
  id: number;
  sourceId: number;
}

export interface Profile {
  diet: DietPreference;
  cuisines: string[];
  spice: Spice;
  maxMinutes: number;
  equipment: Equipment[];
  dislikes: string[];
  goal: Goal;
}

export interface Slot {
  day: number; // 0 = Monday
  meal: MealType;
  recipeId: number | null;
  locked: boolean;
  /** True when this slot eats the leftovers of the same meal the day before. */
  leftover: boolean;
}

export interface Plan {
  weekStart: string; // YYYY-MM-DD, a Monday
  slots: Slot[];
}

export type Rating = 1 | -1;

export const DEFAULT_PROFILE: Profile = {
  diet: "egg",
  cuisines: [],
  spice: 2,
  maxMinutes: 30,
  equipment: ["stove", "pressure_cooker", "fridge"],
  dislikes: [],
  goal: "healthy",
};
