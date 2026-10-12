import ProfileForm from "@/components/ProfileForm";
import { PageHeader } from "@/components/ui";
import * as repo from "@/lib/repo";

export const dynamic = "force-dynamic";

/** The most common cuisines across active recipes, for the cuisine chips. */
function topCuisines(limit = 12): string[] {
  const counts = new Map<string, number>();
  for (const r of repo.listActiveRecipes()) {
    for (const c of r.cuisine.split(/[,/|]/)) {
      const name = c.trim();
      if (!name || /^indian$/i.test(name)) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([n]) => n);
}

export default function ProfilePage() {
  return (
    <>
      <PageHeader eyebrow="Set once, change any time. Every plan follows these." title="What do you love to eat?" />
      <ProfileForm profile={repo.getProfile()} cuisines={topCuisines()} />
    </>
  );
}
