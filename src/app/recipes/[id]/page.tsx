import Link from "next/link";
import { notFound } from "next/navigation";
import { cookedRecipe, rateRecipe } from "@/app/actions";
import { btn, Card, Chip } from "@/components/ui";
import { DIET_LABEL, dishEmoji, EQUIPMENT_LABEL, MEAL_LABEL, SPICE_LABEL } from "@/lib/display";
import * as repo from "@/lib/repo";

export const dynamic = "force-dynamic";

function safeUrl(u: string): string | null {
  try {
    const url = new URL(u);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = repo.getRecipe(Number(id));
  if (!recipe) notFound();
  const rating = repo.getRating(recipe.slug);
  const source = safeUrl(recipe.url);
  const video = safeUrl(recipe.video);
  const nutrition = (
    [
      ["Calories", recipe.calories, "kcal"],
      ["Protein", recipe.protein, "g"],
      ["Carbs", recipe.carbs, "g"],
      ["Fat", recipe.fat, "g"],
      ["Fiber", recipe.fiber, "g"],
    ] as const
  ).filter(([, v]) => v !== null);

  return (
    <>
      <Link href="/" className="mb-4 inline-flex h-9 items-center text-sm font-bold text-ocean no-underline">
        ← Back to this week
      </Link>

      <header className="mb-5 flex flex-wrap items-center gap-6 rounded-[26px] bg-ocean-tint px-8 py-7">
        <div aria-hidden="true" className="flex h-[120px] w-[120px] items-center justify-center rounded-[30px] bg-white text-[68px]">
          {dishEmoji(recipe)}
        </div>
        <div className="flex flex-[1_1_320px] flex-col gap-2">
          <div className="text-[13px] font-extrabold uppercase tracking-wide text-subtle">
            {[recipe.mealTypes.map((m) => MEAL_LABEL[m]).join(" / "), recipe.cuisine].filter(Boolean).join(" · ")}
          </div>
          <h1 className="m-0 font-display text-[44px] font-extrabold leading-none">{recipe.name}</h1>
          {recipe.description && <p className="m-0 max-w-2xl text-subtle">{recipe.description}</p>}
          <div className="flex flex-wrap gap-2">
            {recipe.totalMin !== null && <Chip>⏱️ {recipe.totalMin} min</Chip>}
            {recipe.servings !== null && <Chip>Serves {recipe.servings}</Chip>}
            <Chip>{DIET_LABEL[recipe.dietClass]}</Chip>
            <Chip>{SPICE_LABEL[recipe.spice]} spice</Chip>
            {recipe.equipment.map((e) => (
              <Chip key={e}>{EQUIPMENT_LABEL[e]}</Chip>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-start gap-5">
        <div className="flex flex-[1_1_300px] flex-col gap-5">
          <Card>
            <h2 className="mb-2 mt-0 font-display text-[22px] font-extrabold">Ingredients</h2>
            <ul className="m-0 list-none p-0">
              {recipe.ingredients.map((line, i) => (
                <li key={i}>
                  <label className="flex min-h-[38px] items-center gap-3 text-[15px]">
                    <input type="checkbox" className="h-[18px] w-[18px] accent-ocean" />
                    {line}
                  </label>
                </li>
              ))}
            </ul>
          </Card>
          {nutrition.length > 0 && (
            <Card>
              <h2 className="mb-3 mt-0 font-display text-[22px] font-extrabold">Per serving</h2>
              <dl className="m-0 grid grid-cols-2 gap-3">
                {nutrition.map(([label, value, unit]) => (
                  <div key={label} className="rounded-xl bg-page px-3 py-2">
                    <dt className="text-xs text-muted">{label}</dt>
                    <dd className="m-0 font-bold">
                      {value} {unit}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
        </div>

        <Card className="flex flex-[2_1_420px] flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 font-display text-[22px] font-extrabold">Steps</h2>
            <div className="flex gap-4 text-sm font-bold">
              {video && (
                <a href={video} target="_blank" rel="noreferrer" className="text-ocean no-underline">
                  Watch video ↗
                </a>
              )}
              {source && (
                <a href={source} target="_blank" rel="noreferrer" className="text-ocean no-underline">
                  Original recipe ↗
                </a>
              )}
            </div>
          </div>
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3.5">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-ocean-tint font-extrabold text-ocean-dark">
                  {i + 1}
                </span>
                <span className="pt-1 text-base leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-2 flex flex-wrap items-center gap-2.5 border-t border-dashed border-line pt-4">
            <form action={cookedRecipe.bind(null, recipe.slug)}>
              <button className={btn.primary}>I cooked this</button>
            </form>
            <form action={rateRecipe.bind(null, recipe.slug, rating.value === 1 ? null : 1)}>
              <button aria-pressed={rating.value === 1} className={`${btn.secondary} ${rating.value === 1 ? "!border-ocean !bg-ocean-tint" : ""}`}>
                😍 Loved it
              </button>
            </form>
            <form action={rateRecipe.bind(null, recipe.slug, rating.value === -1 ? null : -1)}>
              <button aria-pressed={rating.value === -1} className={`${btn.secondary} ${rating.value === -1 ? "!border-coral !bg-coral-tint" : ""}`}>
                😐 Not again
              </button>
            </form>
            {rating.cooked > 0 && (
              <span className="text-sm text-muted">Cooked {rating.cooked} time{rating.cooked > 1 ? "s" : ""}</span>
            )}
          </div>
          {rating.value === -1 && <p className="m-0 text-sm text-muted">This dish won&apos;t be planned again until you undo “Not again”.</p>}
        </Card>
      </div>
    </>
  );
}
