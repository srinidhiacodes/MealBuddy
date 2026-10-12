import { describe, expect, it } from "vitest";
import { parseRows, splitList } from "./parse";

const HEADER = [
  "Name", "Slug", "Diet", "Cuisine", "Category", "Cooking Method", "Servings", "Prep (min)", "Cook (min)",
  "Total (min)", "Calories (kcal)", "Protein (g)", "Fat (g)", "Carbs (g)", "Fiber (g)", "Sugar (g)",
  "Ingredient Count", "Ingredients", "Steps", "Description", "Alternate Names", "Keywords", "Image", "Video", "URL",
];

function row(values: Partial<Record<string, string>>): string[] {
  return HEADER.map((h) => values[h] ?? "");
}

describe("splitList", () => {
  it("splits on new lines, pipes and semicolons", () => {
    expect(splitList("a\nb\nc")).toEqual(["a", "b", "c"]);
    expect(splitList("a | b | c")).toEqual(["a", "b", "c"]);
    expect(splitList("a; b")).toEqual(["a", "b"]);
  });
  it("reads JSON arrays", () => {
    expect(splitList('["3 Idly", "2 tbsp Ghee"]')).toEqual(["3 Idly", "2 tbsp Ghee"]);
  });
  it("only splits on commas when the count says there are several items", () => {
    expect(splitList("1 onion, chopped")).toEqual(["1 onion, chopped"]);
    expect(splitList("1 onion, 2 tomatoes", 2)).toEqual(["1 onion", "2 tomatoes"]);
  });
  it("drops step numbering", () => {
    expect(splitList("1. Heat oil\n2) Add onion\nStep 3: Serve")).toEqual(["Heat oil", "Add onion", "Serve"]);
  });
});

describe("parseRows", () => {
  it("reads the full 25-column format", () => {
    const { recipes, report } = parseRows([
      HEADER,
      row({
        Name: "Podi Idly", Slug: "podi-idly", Diet: "Vegetarian", Cuisine: "Indian, Tamil Nadu",
        Servings: "2", "Prep (min)": "5", "Cook (min)": "5", "Total (min)": "10", "Protein (g)": "4.6",
        "Ingredient Count": "3", Ingredients: "3 Idly | 2 tbsp Ghee | 2 tbsp Idly podi", Steps: "Drizzle ghee and podi on idlis.",
        URL: "https://example.com/podi-idly",
      }),
    ]);
    expect(report.missingColumns).toEqual([]);
    expect(report.unknownColumns).toEqual([]);
    expect(report.added).toBe(1);
    expect(recipes[0]).toMatchObject({
      slug: "podi-idly", name: "Podi Idly", servings: 2, totalMin: 10, protein: 4.6,
      ingredients: ["3 Idly", "2 tbsp Ghee", "2 tbsp Idly podi"], steps: ["Drizzle ghee and podi on idlis."],
    });
  });

  it("skips rows without required values and reports why", () => {
    const { recipes, report } = parseRows([
      HEADER,
      row({ Name: "No steps", Ingredients: "1 egg" }),
      row({ Name: "", Ingredients: "1 egg", Steps: "Boil" }),
      row({ Name: "Ok", Ingredients: "1 egg", Steps: "Boil" }),
    ]);
    expect(recipes.map((r) => r.name)).toEqual(["Ok"]);
    expect(report.skipped).toEqual([
      { row: 2, name: "No steps", reason: "no Steps" },
      { row: 3, name: "", reason: "no Name" },
    ]);
  });

  it("drops duplicate slugs inside one file", () => {
    const { report } = parseRows([
      HEADER,
      row({ Name: "Egg dosa", Ingredients: "1 egg", Steps: "Cook" }),
      row({ Name: "Egg Dosa", Ingredients: "1 egg", Steps: "Cook" }),
    ]);
    expect(report.added).toBe(1);
    expect(report.duplicates).toBe(1);
  });

  it("fails clearly when required columns are missing", () => {
    const { recipes, report } = parseRows([["Name", "Diet"], ["Upma", "Veg"]]);
    expect(recipes).toEqual([]);
    expect(report.missingColumns).toEqual(["Ingredients", "Steps"]);
  });

  it("works out total time from prep and cook", () => {
    const { recipes } = parseRows([
      HEADER,
      row({ Name: "Upma", "Prep (min)": "5", "Cook (min)": "15", Ingredients: "1 cup rava", Steps: "Cook" }),
    ]);
    expect(recipes[0].totalMin).toBe(20);
  });
});
