import { describe, expect, it } from "vitest";
import { dietClass, equipment, mealTypes, spiceLevel } from "./tagging";

describe("dietClass", () => {
  it("uses the Diet column", () => {
    expect(dietClass({ diet: "Eggetarian", ingredients: [], name: "x" })).toBe("egg");
    expect(dietClass({ diet: "Non-Vegetarian", ingredients: [], name: "x" })).toBe("nonveg");
    expect(dietClass({ diet: "Vegan", ingredients: ["1 cup rice"], name: "x" })).toBe("vegan");
  });
  it("catches meat or egg hidden in a recipe marked vegetarian", () => {
    expect(dietClass({ diet: "Vegetarian", ingredients: ["200 g chicken"], name: "Biryani" })).toBe("nonveg");
    expect(dietClass({ diet: "Vegetarian", ingredients: ["2 eggs"], name: "Dosa" })).toBe("egg");
    expect(dietClass({ diet: "", ingredients: ["2 Eggs, boiled"], name: "Egg kulambu" })).toBe("egg");
  });
  it("does not call a recipe vegan when it has dairy", () => {
    expect(dietClass({ diet: "Vegan", ingredients: ["1 tbsp ghee"], name: "x" })).toBe("veg");
  });
  it("does not mistake eggplant-free words for egg", () => {
    expect(dietClass({ diet: "Vegetarian", ingredients: ["1 brinjal"], name: "Brinjal fry" })).toBe("veg");
  });
});

describe("mealTypes", () => {
  it("maps tiffin to breakfast and dinner", () => {
    expect(mealTypes({ name: "Ven Pongal", category: "Tiffin", keywords: "Breakfast" })).toEqual(["breakfast", "dinner"]);
    expect(mealTypes({ name: "Rasam Rice with Omelette", category: "Rice", keywords: "Lunch, Dinner" })).toEqual(["lunch", "dinner"]);
    expect(mealTypes({ name: "Idli with Sambar", category: "Tiffin", keywords: "Breakfast" })).not.toContain("lunch");
    expect(mealTypes({ name: "Ragi Dosa", category: "Tiffin", keywords: "" })).toEqual(["breakfast", "dinner"]);
  });
  it("maps curries and rice to lunch and dinner", () => {
    expect(mealTypes({ name: "Egg Kulambu", category: "Curries & Gravies", keywords: "" })).toEqual(["lunch", "dinner"]);
  });
  it("leaves out chutneys, drinks and desserts", () => {
    expect(mealTypes({ name: "Coconut Chutney", category: "Chutneys", keywords: "Dosa, Idli" })).toEqual([]);
    expect(mealTypes({ name: "Filter Coffee", category: "Beverages", keywords: "" })).toEqual([]);
  });
  it("keeps a podi idli as breakfast", () => {
    expect(mealTypes({ name: "Podi Idly", category: "Tiffin, Chutneys, Podis & Pickles", keywords: "Breakfast" })).toContain("breakfast");
  });
});

describe("equipment", () => {
  it("finds pressure cooker, oven and mixie", () => {
    expect(equipment({ cookingMethod: "Pressure Cooker", keywords: "", steps: ["Cook for 3 whistles"] })).toContain("pressure_cooker");
    expect(equipment({ cookingMethod: "", keywords: "", steps: ["Preheat the oven to 180C"] })).toContain("oven");
    expect(equipment({ cookingMethod: "", keywords: "", steps: ["Grind to a paste"] })).toContain("mixie");
  });
  it("needs nothing for no-cook recipes", () => {
    expect(equipment({ cookingMethod: "No Cooking", keywords: "", steps: ["Mix and serve"] })).toEqual([]);
  });
});

describe("spiceLevel", () => {
  it("reads spice words", () => {
    expect(spiceLevel({ description: "Quick, medium-spicy, serves 2", keywords: "", name: "" })).toBe(2);
    expect(spiceLevel({ description: "", keywords: "Mild", name: "" })).toBe(1);
    expect(spiceLevel({ description: "", keywords: "", name: "Chettinad Egg Curry" })).toBe(3);
  });
});
