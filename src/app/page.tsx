import Link from "next/link";
import { lockMeal, planWeek, swapMeal } from "./actions";
import { btn, EmptyState, PageHeader } from "@/components/ui";
import { DAY_SHORT, DIET_LABEL, dayDate, dishEmoji, MEAL_LABEL, todayIndex, weekRangeLabel } from "@/lib/display";
import { buildGroceryList } from "@/lib/grocery";
import { weekStartOf } from "@/lib/planner";
import * as repo from "@/lib/repo";
import { MEALS, type Recipe, type Slot } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function PlanPage() {
  const weekStart = weekStartOf(new Date());
  const recipes = repo.listActiveRecipes();
  const profile = repo.getProfile();
  const plan = repo.getPlan(weekStart);
  const today = todayIndex(weekStart);
  const eyebrow = `${weekRangeLabel(weekStart)} · ${DIET_LABEL[profile.diet]}${
    profile.cuisines.length ? ` · ${profile.cuisines.join(", ")}` : ""
  }`;

  if (!recipes.length) {
    return (
      <>
        <PageHeader eyebrow={eyebrow} title="Hi! Let's plan your week" />
        <EmptyState
          icon="📥"
          title="Add your recipes first"
          text="Upload a CSV or Excel file of recipes. MealBuddy plans your meals only from the files you add."
          href="/recipes"
          cta="Upload recipes"
        />
      </>
    );
  }

  if (!plan) {
    return (
      <>
        <PageHeader eyebrow={eyebrow} title="Hi! Let's plan your week" />
        <section className="flex flex-col items-center gap-3 rounded-[22px] border border-line bg-white py-12 text-center">
          <span aria-hidden="true" className="text-5xl">📅</span>
          <h2 className="m-0 font-display text-2xl font-extrabold">{recipes.length} recipes ready</h2>
          <p className="m-0 max-w-md text-muted">
            Plan 21 meals that fit your taste profile.{" "}
            {!repo.hasProfile() && (
              <>
                You can <Link href="/profile" className="font-bold text-ocean">set your taste profile</Link> first.
              </>
            )}
          </p>
          <form action={planWeek}>
            <button className={btn.primary}>Plan my week</button>
          </form>
        </section>
      </>
    );
  }

  const byId = repo.getRecipesByIds(plan.slots.flatMap((s) => (s.recipeId === null ? [] : [s.recipeId])));
  const groceryCount = buildGroceryList(plan, byId).filter((i) => !i.staple).length;
  const empty = plan.slots.filter((s) => s.recipeId === null).length;

  return (
    <>
      <PageHeader eyebrow={eyebrow} title="Hi! Here's your week">
        <form action={planWeek}>
          <button className={btn.secondary}>Shuffle unlocked</button>
        </form>
        <Link href="/grocery" className={btn.primary}>Grocery list · {groceryCount} items</Link>
      </PageHeader>

      {empty > 0 && (
        <p className="mb-4 rounded-[14px] bg-coral-tint px-4 py-3 text-sm font-semibold text-ink">
          {empty} meal{empty > 1 ? "s" : ""} could not be filled. Add more recipes or relax your{" "}
          <Link href="/profile" className="font-bold text-ocean">taste profile</Link>.
        </p>
      )}

      <div className="overflow-x-auto rounded-[22px] border border-line bg-white">
        <div className="grid min-w-[900px] grid-cols-[104px_repeat(7,minmax(0,1fr))]">
          <div className="border-b border-line" />
          {DAY_SHORT.map((d, i) => (
            <div
              key={d}
              className={`flex flex-col border-b border-line px-3.5 py-3 ${i === today ? "bg-coral text-white" : ""}`}
            >
              <span className={`text-xs ${i === today ? "font-extrabold" : "font-semibold text-muted"}`}>
                {d}
                {i === today && " · Today"}
              </span>
              <span className="font-display text-[22px] font-extrabold leading-tight">{dayDate(weekStart, i).getDate()}</span>
            </div>
          ))}
          {MEALS.map((meal) => (
            <MealRow key={meal} meal={meal} slots={plan.slots} byId={byId} today={today} />
          ))}
        </div>
      </div>
      <p className="mt-3 text-[13px] text-muted">
        Click a meal to open its recipe. 🔒 keeps a meal when you shuffle; ⇄ picks another dish.
      </p>
    </>
  );
}

function MealRow({ meal, slots, byId, today }: { meal: (typeof MEALS)[number]; slots: Slot[]; byId: Map<number, Recipe>; today: number }) {
  return (
    <>
      <div className="border-b border-line-soft p-4 text-xs font-extrabold uppercase tracking-wide text-muted">{MEAL_LABEL[meal]}</div>
      {Array.from({ length: 7 }, (_, day) => {
        const slot = slots.find((s) => s.day === day && s.meal === meal);
        const recipe = slot?.recipeId != null ? byId.get(slot.recipeId) : undefined;
        const isToday = day === today;
        return (
          <div
            key={day}
            className={`group flex min-h-[112px] flex-col gap-2 border-b border-line-soft p-3.5 ${
              isToday ? "bg-coral-tint" : "border-l"
            }`}
          >
            {recipe ? (
              <Link
                href={`/recipes/${recipe.id}`}
                title={recipe.totalMin ? `${recipe.totalMin} min` : undefined}
                className="flex flex-col gap-2 no-underline"
              >
                <span aria-hidden="true" className="text-[22px]">{dishEmoji(recipe)}</span>
                <span className={`text-sm leading-snug ${isToday ? "font-bold" : "font-semibold"}`}>{recipe.name}</span>
              </Link>
            ) : (
              <span className="text-sm text-muted">{slot?.recipeId != null ? "Recipe removed" : "Nothing fits"}</span>
            )}
            <div className="mt-auto flex flex-wrap items-center gap-1.5">
              {slot?.locked && <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white">Locked</span>}
              {slot?.leftover && (
                <span className="rounded-full bg-ocean-tint px-2 py-0.5 text-[11px] font-bold text-ocean-dark">Leftover</span>
              )}
              {slot && (
                <span className="ml-auto flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  <form action={lockMeal.bind(null, day, meal)}>
                    <button aria-label={slot.locked ? "Unlock meal" : "Lock meal"} title={slot.locked ? "Unlock" : "Lock"} className={btn.icon}>
                      {slot.locked ? "🔓" : "🔒"}
                    </button>
                  </form>
                  {!slot.locked && (
                    <form action={swapMeal.bind(null, day, meal)}>
                      <button aria-label="Swap meal" title="Swap" className={btn.icon}>⇄</button>
                    </form>
                  )}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
