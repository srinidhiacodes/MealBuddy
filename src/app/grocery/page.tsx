import GroceryChecklist from "@/components/GroceryChecklist";
import { EmptyState, PageHeader } from "@/components/ui";
import { weekRangeLabel } from "@/lib/display";
import { buildGroceryList } from "@/lib/grocery";
import { weekStartOf } from "@/lib/planner";
import * as repo from "@/lib/repo";

export const dynamic = "force-dynamic";

export default function GroceryPage() {
  const weekStart = weekStartOf(new Date());
  const plan = repo.getPlan(weekStart);
  if (!plan) {
    return (
      <>
        <PageHeader title="Grocery list" />
        <EmptyState icon="🛒" title="No plan yet" text="Plan your week first and your shopping list appears here." href="/" cta="Go to weekly plan" />
      </>
    );
  }
  const byId = repo.getRecipesByIds(plan.slots.flatMap((s) => (s.recipeId === null ? [] : [s.recipeId])));
  const items = buildGroceryList(plan, byId);
  const meals = plan.slots.filter((s) => s.recipeId !== null && byId.has(s.recipeId)).length;

  return (
    <>
      <PageHeader eyebrow={`For ${weekRangeLabel(weekStart)} · ${meals} meals`} title="Grocery list" />
      <GroceryChecklist weekStart={weekStart} items={items} checked={[...repo.getGroceryChecks(weekStart)]} />
      <p className="mt-4 text-[13px] text-muted">Amounts are scaled to one person. Hover an item to see which dishes need it.</p>
    </>
  );
}
