"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Weekly plan", icon: "📅" },
  { href: "/recipes", label: "Recipes", icon: "📚" },
  { href: "/grocery", label: "Grocery list", icon: "🛒" },
  { href: "/profile", label: "Taste profile", icon: "😋" },
];

export default function Sidebar() {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <aside className="flex flex-[1_1_220px] flex-col gap-7 border-r border-line bg-page px-4 py-7">
      <Link href="/" className="flex items-center gap-2.5 px-1.5 no-underline">
        <span aria-hidden="true" className="text-[28px]">🍛</span>
        <span className="font-display text-[26px] font-extrabold text-ocean">
          Meal<span className="text-coral-bright">Buddy</span>
        </span>
      </Link>
      <nav aria-label="Main" className="flex flex-col gap-1.5">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(l.href) ? "page" : undefined}
            className={`flex h-[46px] items-center gap-3 rounded-[14px] px-3.5 text-[15px] no-underline ${
              isActive(l.href) ? "bg-ocean font-bold text-white" : "font-semibold text-subtle hover:bg-ocean-tint"
            }`}
          >
            <span aria-hidden="true" className="text-lg">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
