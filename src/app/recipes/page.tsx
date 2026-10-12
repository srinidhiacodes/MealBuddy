import Link from "next/link";
import SourceActions from "@/components/SourceActions";
import UploadForm from "@/components/UploadForm";
import { Card, PageHeader } from "@/components/ui";
import { DIET_LABEL, dishEmoji, MEAL_LABEL } from "@/lib/display";
import * as repo from "@/lib/repo";

export const dynamic = "force-dynamic";

const COLUMN_GROUPS: [string, string[]][] = [
  ["Basics", ["Name", "Slug", "Description", "Alternate Names", "Keywords"]],
  ["Planning", ["Diet", "Cuisine", "Category", "Cooking Method", "Servings", "Prep (min)", "Cook (min)", "Total (min)"]],
  ["Nutrition", ["Calories (kcal)", "Protein (g)", "Fat (g)", "Carbs (g)", "Fiber (g)", "Sugar (g)"]],
  ["Recipe", ["Ingredient Count", "Ingredients", "Steps"]],
  ["Media and source", ["Image", "Video", "URL"]],
];
const REQUIRED = new Set(["Name", "Ingredients", "Steps"]);

export default async function RecipesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const sources = repo.listSources();
  const recipes = repo.listActiveRecipes();
  const query = q.trim().toLowerCase();
  const shown = (query
    ? recipes.filter((r) => `${r.name} ${r.cuisine} ${r.category} ${r.altNames}`.toLowerCase().includes(query))
    : recipes
  ).slice(0, 60);
  const plannable = recipes.filter((r) => r.mealTypes.length).length;

  return (
    <>
      <PageHeader
        eyebrow={`${recipes.length} recipes in ${sources.filter((s) => s.enabled).length} active file(s) · ${plannable} usable for meals`}
        title="Recipe library"
      />

      <div className="mb-5 flex flex-wrap items-stretch gap-4">
        <UploadForm />
        <Card className="flex flex-[3_1_440px] flex-col gap-3 !p-5">
          <h2 className="m-0 font-display text-xl font-extrabold">Columns we read</h2>
          {COLUMN_GROUPS.map(([label, cols]) => (
            <div key={label} className="flex flex-col gap-1.5">
              <div className="text-[13px] font-extrabold text-subtle">{label}</div>
              <div className="flex flex-wrap gap-1.5">
                {cols.map((c) => (
                  <code
                    key={c}
                    className={`rounded-lg px-2 py-1 text-[13px] ${REQUIRED.has(c) ? "bg-ocean font-bold text-white" : "bg-ocean-tint text-ink"}`}
                  >
                    {c}
                    {REQUIRED.has(c) && " *"}
                  </code>
                ))}
              </div>
            </div>
          ))}
          <p className="m-0 text-[13px] text-muted">
            * required. Ingredients and Steps can be one per line or separated by |. Missing meal type, equipment and spice
            level are worked out automatically.
          </p>
        </Card>
      </div>

      {sources.length > 0 && (
        <Card className="mb-5 overflow-x-auto !p-0">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="text-xs font-extrabold uppercase tracking-wide text-muted">
                <th className="border-b border-line px-5 py-3.5">File</th>
                <th className="border-b border-line px-3 py-3.5">Recipes</th>
                <th className="border-b border-line px-3 py-3.5">Added</th>
                <th className="border-b border-line px-3 py-3.5">Import report</th>
                <th className="border-b border-line px-3 py-3.5">Use in plans</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.id} className="text-[15px]">
                  <td className="border-b border-line-soft px-5 py-3.5 font-bold">{s.name}</td>
                  <td className="border-b border-line-soft px-3 py-3.5 font-bold">{s.recipeCount}</td>
                  <td className="border-b border-line-soft px-3 py-3.5 text-sm text-muted">
                    {new Date(s.addedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                  <td className="border-b border-line-soft px-3 py-3.5 text-sm text-subtle">
                    {s.report.added} added
                    {s.report.duplicates > 0 && ` · ${s.report.duplicates} duplicates`}
                    {s.report.skipped.length > 0 && (
                      <details className="inline">
                        <summary className="inline cursor-pointer"> · {s.report.skipped.length} skipped</summary>
                        <ul className="mt-1 list-disc pl-5">
                          {s.report.skipped.slice(0, 20).map((k) => (
                            <li key={k.row}>
                              Row {k.row}
                              {k.name && ` (${k.name})`}: {k.reason}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </td>
                  <td className="border-b border-line-soft px-3 py-3.5">
                    <SourceActions id={s.id} name={s.name} enabled={s.enabled} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {recipes.length > 0 && (
        <Card className="!p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 font-display text-xl font-extrabold">Browse recipes</h2>
            <form className="flex gap-2" role="search">
              <label htmlFor="q" className="sr-only">Search recipes</label>
              <input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="Search by name or cuisine"
                className="h-10 w-64 rounded-xl border border-control px-3 text-sm"
              />
              <button className="h-10 rounded-xl bg-ocean px-4 text-sm font-bold text-white">Search</button>
            </form>
          </div>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 p-0">
            {shown.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/recipes/${r.id}`}
                  className="flex h-full gap-3 rounded-2xl border border-line-soft p-3 no-underline hover:border-ocean"
                >
                  <span aria-hidden="true" className="text-2xl">{dishEmoji(r)}</span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-bold">{r.name}</span>
                    <span className="text-xs text-muted">
                      {[DIET_LABEL[r.dietClass], r.totalMin ? `${r.totalMin} min` : "", r.mealTypes.map((m) => MEAL_LABEL[m]).join(", ") || "Side / snack"]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {shown.length === 0 && <p className="text-sm text-muted">No recipes match “{q}”.</p>}
        </Card>
      )}
    </>
  );
}
