import type { Plan, Recipe } from "./types";

export interface ParsedIngredient {
  qty: number | null;
  unit: string | null;
  name: string;
}

const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };

const UNITS: [RegExp, string][] = [
  [/^(kg|kgs|kilograms?)$/i, "kg"],
  [/^(g|gm|gms|grams?)$/i, "g"],
  [/^(l|ltr|litres?|liters?)$/i, "l"],
  [/^(ml|millilitres?|milliliters?)$/i, "ml"],
  [/^(cups?)$/i, "cup"],
  [/^(tbsp|tbsps|tablespoons?|tbs)$/i, "tbsp"],
  [/^(tsp|tsps|teaspoons?)$/i, "tsp"],
  [/^(pinch|pinches)$/i, "pinch"],
  [/^(inch|inches)$/i, "inch"],
  [/^(sprigs?)$/i, "sprig"],
  [/^(cloves?)$/i, "clove"],
  [/^(nos?|pieces?|pcs?)$/i, "pc"],
  [/^(handfuls?)$/i, "handful"],
  [/^(bunch|bunches)$/i, "bunch"],
  [/^(slices?)$/i, "slice"],
  [/^(packets?|packs?)$/i, "packet"],
  [/^(cans?)$/i, "can"],
  [/^(ladles?)$/i, "ladle"],
  [/^(balls?)$/i, "ball"],
];

function parseQty(token: string): number | null {
  if (FRACTIONS[token] !== undefined) return FRACTIONS[token];
  const mixed = token.match(/^(\d+)([½¼¾⅓⅔⅛])$/);
  if (mixed) return Number(mixed[1]) + FRACTIONS[mixed[2]];
  const frac = token.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const range = token.match(/^(\d+(?:\.\d+)?)[-–](\d+(?:\.\d+)?)$/);
  if (range) return Number(range[2]);
  if (/^\d+(\.\d+)?$/.test(token)) return Number(token);
  return null;
}

const SINGULAR: [RegExp, string][] = [
  [/(tomato|potato)es$/, "$1"],
  [/chillies$/, "chilli"],
  [/ies$/, "y"],
  [/(onion|shallot|egg|carrot|clove|cardamom|bean|pea|almond|cashew|leaf)s$/, "$1"],
];

export function normaliseName(raw: string): string {
  let n = raw
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/\b(to taste|as needed|as required|for garnish|optional)\b.*$/, "")
    .split(",")[0]
    .replace(/\b(finely|roughly|thinly|freshly)?\s*(chopped|sliced|diced|grated|minced|crushed|boiled|peeled|soaked|cooked|beaten|whisked)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (n !== "curry leaves") for (const [re, rep] of SINGULAR) n = n.replace(re, rep);
  return n;
}

export function parseIngredient(raw: string): ParsedIngredient {
  const tokens = raw.trim().split(/\s+/);
  let qty: number | null = null;
  let i = 0;
  while (i < tokens.length) {
    const q = parseQty(tokens[i]);
    if (q === null) break;
    qty = (qty ?? 0) + q;
    i++;
  }
  let unit: string | null = null;
  while (i < tokens.length - 1 && /^(small|medium|large|big)$/i.test(tokens[i])) i++;
  if (i < tokens.length) {
    const t = tokens[i].replace(/\.$/, "");
    for (const [re, u] of UNITS) {
      if (re.test(t)) {
        unit = u;
        i++;
        break;
      }
    }
  }
  return { qty, unit, name: normaliseName(tokens.slice(i).join(" ")) || normaliseName(raw) };
}

const CATEGORIES: [string, RegExp][] = [
  ["Spices and masala", /powder|masala|seeds?\b|jeera|cumin|mustard|turmeric|pepper|hing|asafoetida|cinnamon|cardamom|clove|fennel|fenugreek|methi seed|bay leaf|salt|sugar|jaggery|tamarind|saffron|star anise/],
  ["Eggs and dairy", /\begg|milk|curd|yog(h)?urt|paneer|butter|ghee|cream|cheese|buttermilk/],
  ["Grains, flours and dals", /rice|dal\b|dhal|flour|atta|maida|rava|sooji|semolina|ragi|poha|aval|oats|bread|batter|vermicelli|semiya|noodles|pasta|chana|rajma|moong|toor|urad|chickpea|lentil|idl[iy]|dosa|millet/],
  ["Vegetables and fruits", /onion|tomato|potato|beans|carrot|chilli|chili|ginger|garlic|lemon|lime|coriander|curry leaves|mint|capsicum|cabbage|brinjal|drumstick|spinach|keerai|\bpeas?\b|cauliflower|banana|cucumber|beetroot|okra|ladies finger|bhindi|pumpkin|radish|gourd|mushroom|corn|shallot|spring onion|mango|apple|cilantro|leaves/],
];

const STAPLES = /^(salt|water|sugar|turmeric powder|turmeric|mustard seeds?|cumin seeds?|jeera|hing|asafoetida|ice|.*\boil)$/;

export function categoryOf(name: string): string {
  for (const [cat, re] of CATEGORIES) if (re.test(name)) return cat;
  return "Others";
}

export function isStaple(name: string): boolean {
  return STAPLES.test(name);
}

export interface GroceryItem {
  key: string;
  name: string;
  amount: string; // display text, e.g. "750 g", "3", "" when unknown
  category: string;
  staple: boolean;
  recipes: string[];
}

type Family = "g" | "ml" | "tsp" | "count" | string;

function toBase(qty: number, unit: string | null): { family: Family; value: number } {
  switch (unit) {
    case "kg": return { family: "g", value: qty * 1000 };
    case "g": return { family: "g", value: qty };
    case "l": return { family: "ml", value: qty * 1000 };
    case "ml": return { family: "ml", value: qty };
    case "tbsp": return { family: "tsp", value: qty * 3 };
    case "tsp": return { family: "tsp", value: qty };
    case null:
    case "pc": return { family: "count", value: qty };
    default: return { family: unit, value: qty };
  }
}

const QUARTERS = ["", "¼", "½", "¾"];

/** 0.5 → "½", 1.75 → "1¾", 12.3 → "12". */
function round(n: number): string {
  if (n >= 10) return String(Math.round(n));
  const q = Math.max(1, Math.round(n * 4));
  const whole = Math.floor(q / 4);
  return `${whole || ""}${QUARTERS[q % 4]}` || "0";
}

function formatAmount(family: Family, value: number): string {
  switch (family) {
    case "g": return value >= 1000 ? `${round(value / 1000)} kg` : `${round(value)} g`;
    case "ml": return value >= 1000 ? `${round(value / 1000)} L` : `${round(value)} ml`;
    case "tsp": return value >= 3 ? `${round(value / 3)} tbsp` : `${round(value)} tsp`;
    case "count": return String(Math.max(1, Math.ceil(value - 0.01)));
    default: return `${round(value)} ${family}${value > 1 && !family.endsWith("s") ? "s" : ""}`;
  }
}

/**
 * Builds the week's shopping list. Each recipe is scaled to the number of
 * meals it covers (a dish plus its leftover = 2 portions) over its servings.
 */
export function buildGroceryList(plan: Plan, recipes: Map<number, Recipe>): GroceryItem[] {
  const portions = new Map<number, number>();
  for (const s of plan.slots) {
    if (s.recipeId === null || !recipes.has(s.recipeId)) continue;
    portions.set(s.recipeId, (portions.get(s.recipeId) ?? 0) + 1);
  }

  const totals = new Map<string, { name: string; family: Family; value: number; hasQty: boolean; recipes: Set<string> }>();
  for (const [id, count] of portions) {
    const r = recipes.get(id)!;
    const factor = count / Math.max(r.servings ?? 2, 1);
    for (const line of r.ingredients) {
      const p = parseIngredient(line);
      if (!p.name) continue;
      const base = p.qty !== null ? toBase(p.qty * factor, p.unit) : { family: p.unit ?? "count", value: 0 };
      const key = `${p.name}|${base.family}`;
      const t = totals.get(key) ?? { name: p.name, family: base.family, value: 0, hasQty: false, recipes: new Set() };
      t.value += base.value;
      t.hasQty ||= p.qty !== null;
      t.recipes.add(r.name);
      totals.set(key, t);
    }
  }

  // One line per ingredient name; join amounts in different units.
  const byName = new Map<string, GroceryItem>();
  for (const t of totals.values()) {
    const amount = t.hasQty ? formatAmount(t.family, t.value) : "";
    const existing = byName.get(t.name);
    if (existing) {
      if (amount) existing.amount = existing.amount ? `${existing.amount} + ${amount}` : amount;
      t.recipes.forEach((r) => existing.recipes.includes(r) || existing.recipes.push(r));
      continue;
    }
    byName.set(t.name, {
      key: t.name,
      name: t.name[0].toUpperCase() + t.name.slice(1),
      amount,
      category: categoryOf(t.name),
      staple: isStaple(t.name),
      recipes: [...t.recipes],
    });
  }
  return [...byName.values()].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}
