import type { DietClass, Equipment, MealType, RecipeInput, RecipeTags, Spice } from "./types";

const words = (list: string[]) => new RegExp(`\\b(?:${list.join("|")})\\b`, "i");

const NON_VEG = words([
  "chicken", "mutton", "lamb", "goat", "beef", "pork", "bacon", "ham", "meat", "keema",
  "fish", "prawns?", "shrimps?", "crabs?", "squid", "lobster", "tuna", "sardines?",
  "anchov(?:y|ies)", "salmon", "meen", "eral", "nandu", "kozhi", "nethili", "vanjaram",
]);
const EGG = words(["eggs?", "omelet(?:te)?s?", "anda", "mutta", "muttai", "bhurji", "podimas"]);
const DAIRY = words([
  "milk", "curd", "yog(?:h)?urt", "ghee", "butter", "paneer", "cream", "cheese",
  "khoa", "khova", "buttermilk", "malai",
]);

/** Works out vegan / veg / egg / nonveg from the Diet column, then double-checks ingredients. */
export function dietClass(r: Pick<RecipeInput, "diet" | "ingredients" | "name">): DietClass {
  const diet = r.diet.toLowerCase();
  const ingredients = r.ingredients.join(" | ");
  const all = `${r.name} | ${ingredients}`;
  if (/non[\s-]?veg/.test(diet) || NON_VEG.test(all)) return "nonveg";
  if (/egg/.test(diet) || EGG.test(all)) return "egg";
  if (/vegan/.test(diet)) return DAIRY.test(ingredients) ? "veg" : "vegan";
  return "veg";
}

const BREAKFAST = /breakfast|tiffin|dosa|dosai|idli|idly|upma|pongal|poha|aval|uttapam|oothappam|appam|idiyappam|puttu|pesarattu|paniyaram|omelet|sandwich|toast|porridge|kanji|paratha|poori|puri/i;
const LUNCH = /lunch|\brice\b|biryani|pulao|pulav|kuzhambu|kulambu|sambar|rasam|curry|curries|gravy|gravies|kootu|poriyal|\bdal\b|thali|kurma|korma|chana|rajma|paneer/i;
const DINNER = /dinner|chapati|chapathi|roti|paratha|parotta|dosa|dosai|idli|idly|uttapam|appam|idiyappam|curry|curries|gravy|gravies|kurma|korma|chana|rajma|paneer|noodles|\brice\b|rasam/i;
const NOT_A_MEAL = /dessert|sweet|payasam|halwa|ladoo|laddu|beverage|drink|juice|smoothie|milkshake|coffee|\btea\b|chutney|podi|pickle|thokku|raita|salad|soup|dip/i;

/**
 * Which meals a recipe can fill. Meal words in Keywords/Category win, then the
 * category (Tiffin, Rice, Curries…), and only then the dish name. Side dishes,
 * drinks and desserts fill none.
 */
export function mealTypes(r: Pick<RecipeInput, "name" | "category" | "keywords">): MealType[] {
  const labels = `${r.category} ${r.keywords}`;
  const found = new Set<MealType>();
  if (/breakfast/i.test(labels)) found.add("breakfast");
  if (/lunch/i.test(labels)) found.add("lunch");
  if (/dinner/i.test(labels)) found.add("dinner");
  if (/tiffin/i.test(r.category)) {
    found.add("breakfast");
    found.add("dinner");
  }
  if (/rice|biryani|pulao|curr|gravy|gravies|kurma|korma|kuzhambu|kulambu|sambar|rasam|\bdal\b/i.test(r.category)) {
    found.add("lunch");
    found.add("dinner");
  }
  if (!found.size) {
    if (BREAKFAST.test(r.name)) found.add("breakfast");
    if (LUNCH.test(r.name)) found.add("lunch");
    if (DINNER.test(r.name)) found.add("dinner");
  }
  // A chutney or podi recipe can mention "dosa" in its keywords; only keep it if
  // its own name looks like a meal.
  if (NOT_A_MEAL.test(r.name) && !/idl[iy]|dosa|rice|roti|chapat/i.test(r.name)) return [];
  if (NOT_A_MEAL.test(r.category) && !/breakfast|lunch|dinner|tiffin/i.test(labels)) return [];
  return (["breakfast", "lunch", "dinner"] as const).filter((m) => found.has(m));
}

/** Kitchen equipment a recipe needs, from its cooking method, keywords and steps. */
export function equipment(r: Pick<RecipeInput, "cookingMethod" | "keywords" | "steps">): Equipment[] {
  const t = `${r.cookingMethod} ${r.keywords} ${r.steps.join(" ")}`.toLowerCase();
  const out = new Set<Equipment>();
  if (/pressure cook|cooker|whistle/.test(t)) out.add("pressure_cooker");
  if (/\boven\b|\bbake\b|baking|preheat/.test(t)) out.add("oven");
  if (/microwave/.test(t)) out.add("microwave");
  if (/air[\s-]?fr(y|ier)/.test(t)) out.add("air_fryer");
  if (/mixie|mixer|grind|blend|food processor/.test(t)) out.add("mixie");
  if (/range|stove|tawa|tava|kadai|kadhai|\bpan\b|\bpot\b|boil|fry|saute|sauté|simmer|\bheat\b|temper/.test(t)) {
    out.add("stove");
  }
  if (!out.size && !/no cook/.test(t)) out.add("stove");
  return [...out];
}

export function spiceLevel(r: Pick<RecipeInput, "description" | "keywords" | "name">): Spice {
  const t = `${r.description} ${r.keywords} ${r.name}`.toLowerCase();
  if (/medium[\s-]?spic|mildly spicy/.test(t)) return 2;
  if (/very spicy|extra spicy|fiery|\bhot\b|chettinad/.test(t)) return 3;
  if (/\bmild\b|kid/.test(t)) return 1;
  if (/spicy/.test(t)) return 3;
  return 2;
}

const BATCH = /kuzhambu|kulambu|sambar|rasam|curry|gravy|kurma|korma|\bdal\b|chana|rajma|biryani|pulao|kootu/i;

export function deriveTags(r: RecipeInput): RecipeTags {
  return {
    dietClass: dietClass(r),
    mealTypes: mealTypes(r),
    equipment: equipment(r),
    spice: spiceLevel(r),
    batchFriendly: BATCH.test(`${r.name} ${r.category}`) && (r.servings ?? 2) >= 2,
  };
}
