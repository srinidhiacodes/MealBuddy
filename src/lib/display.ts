import type { MealType, Recipe } from "./types";

const DISH_EMOJI: [RegExp, string][] = [
  [/omelet|egg|mutta|podimas/i, "🥚"],
  [/biryani|pulao|kulambu|kuzhambu|curry|kurma|korma|gravy|masala/i, "🍛"],
  [/sambar|rasam|kootu|dal\b|soup/i, "🍲"],
  [/lemon/i, "🍋"],
  [/rice|pongal|bath/i, "🍚"],
  [/dosa|dosai|chapat|roti|paratha|parotta|poori|puri|uttapam|appam|pesarattu/i, "🫓"],
  [/idli|idly|idiyappam|puttu|paniyaram/i, "🍥"],
  [/upma|poha|aval|porridge|kanji|oats/i, "🥣"],
  [/bread|toast|sandwich/i, "🍞"],
  [/noodle|pasta/i, "🍜"],
  [/chilli|chettinad/i, "🌶️"],
];

export function dishEmoji(r: Pick<Recipe, "name">): string {
  for (const [re, e] of DISH_EMOJI) if (re.test(r.name)) return e;
  return "🍽️";
}

export const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAY_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Date of day `offset` (0 = Monday) in the week starting `weekStart`. */
export function dayDate(weekStart: string, offset: number): Date {
  const [y, m, d] = weekStart.split("-").map(Number);
  return new Date(y, m - 1, d + offset);
}

export function weekRangeLabel(weekStart: string): string {
  const a = dayDate(weekStart, 0);
  const b = dayDate(weekStart, 6);
  const left = `${MONTHS[a.getMonth()]} ${a.getDate()}`;
  const right = a.getMonth() === b.getMonth() ? `${b.getDate()}` : `${MONTHS[b.getMonth()]} ${b.getDate()}`;
  return `${left} – ${right}`;
}

/** 0 = Monday … 6 = Sunday for today, or -1 when today is outside the week. */
export function todayIndex(weekStart: string, now = new Date()): number {
  for (let i = 0; i < 7; i++) {
    const d = dayDate(weekStart, i);
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) {
      return i;
    }
  }
  return -1;
}

export const DIET_LABEL = { vegan: "Vegan", veg: "Vegetarian", egg: "Eggetarian", nonveg: "Non-vegetarian" } as const;

export const EQUIPMENT_LABEL: Record<string, string> = {
  stove: "Stove / induction",
  pressure_cooker: "Pressure cooker",
  mixie: "Mixie",
  microwave: "Microwave",
  oven: "Oven",
  air_fryer: "Air fryer",
  kettle: "Kettle",
  fridge: "Fridge",
};

export const SPICE_LABEL = { 1: "Mild", 2: "Medium", 3: "Spicy" } as const;
