"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { checkGroceryItem } from "@/app/actions";
import type { GroceryItem } from "@/lib/grocery";
import { btn } from "./ui";

export default function GroceryChecklist({
  weekStart,
  items,
  checked,
}: {
  weekStart: string;
  items: GroceryItem[];
  checked: string[];
}) {
  const [hideStaples, setHideStaples] = useState(true);
  const [copied, setCopied] = useState(false);
  const [, start] = useTransition();
  const [done, setDone] = useOptimistic(new Set(checked), (state, change: { key: string; on: boolean }) => {
    const next = new Set(state);
    if (change.on) next.add(change.key);
    else next.delete(change.key);
    return next;
  });

  const visible = items.filter((i) => !hideStaples || !i.staple);
  const groups = useMemo(() => {
    const m = new Map<string, GroceryItem[]>();
    for (const i of visible) m.set(i.category, [...(m.get(i.category) ?? []), i]);
    return [...m.entries()];
  }, [visible]);
  const bought = visible.filter((i) => done.has(i.key)).length;
  const pct = visible.length ? Math.round((bought / visible.length) * 100) : 0;

  function toggle(key: string, on: boolean) {
    start(async () => {
      setDone({ key, on });
      await checkGroceryItem(weekStart, key, on);
    });
  }

  async function copy() {
    const text = groups
      .map(([cat, list]) => {
        const lines = list.filter((i) => !done.has(i.key)).map((i) => `- ${i.name}${i.amount ? ` ${i.amount}` : ""}`);
        return lines.length ? `${cat}\n${lines.join("\n")}` : "";
      })
      .filter(Boolean)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-[20px] border border-line bg-white px-5 py-4">
        <div className="flex flex-[1_1_240px] flex-col gap-2">
          <span className="text-[15px] font-bold">
            {bought} of {visible.length} items bought
          </span>
          <div className="h-3 overflow-hidden rounded-md bg-line-soft">
            <div className="h-full rounded-md bg-ocean transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <label className="flex h-[46px] items-center gap-2.5 rounded-[14px] border border-line px-3.5 text-sm font-bold">
          <input
            type="checkbox"
            checked={hideStaples}
            onChange={(e) => setHideStaples(e.target.checked)}
            className="h-[18px] w-[18px] accent-ocean"
          />
          Hide pantry staples
        </label>
        <button type="button" onClick={copy} className={btn.primary}>
          {copied ? "Copied!" : "Copy list"}
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] items-start gap-4">
        {groups.map(([cat, list]) => (
          <section key={cat} className="overflow-hidden rounded-[22px] border border-line bg-white">
            <h2 className="m-0 flex items-center justify-between bg-ocean-tint px-[18px] py-3.5 font-display text-[19px] font-extrabold">
              {cat}
              <span className="font-sans text-sm font-bold">{list.length}</span>
            </h2>
            <ul className="m-0 list-none px-[18px] pb-3 pt-1.5">
              {list.map((i) => (
                <li key={i.key} className="border-b border-line-soft last:border-0">
                  <label className="flex min-h-[44px] items-center gap-3 text-[15px]" title={i.recipes.join(", ")}>
                    <input
                      type="checkbox"
                      checked={done.has(i.key)}
                      onChange={(e) => toggle(i.key, e.target.checked)}
                      className="h-[18px] w-[18px] accent-ocean"
                    />
                    <span className={`flex-1 ${done.has(i.key) ? "text-muted line-through" : ""}`}>{i.name}</span>
                    <span className="text-sm text-muted">{i.amount}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
