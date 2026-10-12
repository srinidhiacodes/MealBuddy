"use client";

import { useTransition } from "react";
import { removeSource, toggleSource } from "@/app/actions";

export default function SourceActions({ id, name, enabled }: { id: number; name: string; enabled: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
        <input
          type="checkbox"
          checked={enabled}
          disabled={pending}
          onChange={(e) => start(() => toggleSource(id, e.target.checked))}
          className="h-[18px] w-[18px] accent-ocean"
        />
        {enabled ? "On" : "Off"}
      </label>
      <button
        type="button"
        aria-label={`Remove ${name}`}
        disabled={pending}
        onClick={() => {
          if (confirm(`Remove ${name} and its recipes?`)) start(() => removeSource(id));
        }}
        className="h-9 rounded-[10px] px-2 text-sm font-semibold text-muted hover:bg-coral-tint hover:text-ink"
      >
        Remove
      </button>
    </div>
  );
}
