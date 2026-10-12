# MealBuddy 🍛

Plan a week of simple, healthy home meals from your own recipe files. Built for a bachelor in a PG or flat with a small kitchen: eggetarian-friendly, quick dishes, one grocery list.

## What it does

- **Recipe library:** upload one or more CSV or Excel (.xlsx) files. Each file is a source you can switch on or off, and you get an import report (added, duplicates, skipped rows and why).
- **Auto-tagging:** works out vegan / vegetarian / eggetarian / non-veg, breakfast / lunch / dinner, kitchen equipment, spice level and whether a dish keeps as leftovers. The Diet column is double-checked against the ingredients, so meat or fish never reach a vegetarian or eggetarian plan.
- **Taste profile:** diet, cuisines, spice level, time per meal, kitchen equipment, foods you don't eat, health goal.
- **Weekly planner:** 7 days × 3 meals without repeats. Lock meals you want to keep, swap one meal, or shuffle the rest. With a fridge, a curry can be cooked once and eaten twice (at most two leftovers a week).
- **Recipe page:** ingredients, steps, time, nutrition and source link, plus "I cooked this", "Loved it" and "Not again". Loved dishes come up more; "Not again" dishes stop appearing.
- **Grocery list:** the week's ingredients combined and scaled to one person, grouped by category. Tick items as you shop, hide pantry staples, copy the list.

## Run it

Needs Node.js 22 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
```

Or for a faster production build:

```bash
npm run build
npm start
```

Your data is stored in `data/mealbuddy.db` (SQLite, not committed). Set `MEALBUDDY_DB=/path/to/file.db` to keep it elsewhere.

To try it without your own file, upload `samples/sample_recipes.csv` on the Recipes page.

## Recipe file format

The first row is the header. Only **Name**, **Ingredients** and **Steps** are required; every other column is optional.

| Group | Columns |
|---|---|
| Basics | Name, Slug, Description, Alternate Names, Keywords |
| Planning | Diet, Cuisine, Category, Cooking Method, Servings, Prep (min), Cook (min), Total (min) |
| Nutrition | Calories (kcal), Protein (g), Fat (g), Carbs (g), Fiber (g), Sugar (g) |
| Recipe | Ingredient Count, Ingredients, Steps |
| Media and source | Image, Video, URL |

- **Ingredients** and **Steps**: one item per line, or separated by `|` or `;`, or a JSON array. Step numbers like `1.` are removed.
- **Slug** is used to spot duplicates. If it is empty, it is made from the name.
- **Category** and **Keywords** decide the meal: `Tiffin` → breakfast and dinner; `Rice`, `Curries & Gravies`, `Sambar`… → lunch and dinner; the words `Breakfast`, `Lunch`, `Dinner` also count. Chutneys, podis, drinks and desserts are kept in the library but not planned as meals.

## Project layout

```
src/
  app/            pages (plan, recipes, recipe detail, grocery, profile) and server actions
  components/     sidebar, upload form, grocery checklist, profile form, shared UI
  lib/
    import/       CSV/XLSX reading and row parsing
    tagging.ts    diet, meal type, equipment, spice and leftover tags
    planner.ts    weekly plan, lock, swap
    grocery.ts    ingredient parsing and the shopping list
    repo.ts, db.ts  SQLite storage
samples/          sample recipe file
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the app in development mode |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests (import, tagging, planner, grocery) |
| `npm run lint` | ESLint |

Stack: Next.js 15, React 19, TypeScript, Tailwind CSS 4, SQLite (better-sqlite3), PapaParse and read-excel-file.
