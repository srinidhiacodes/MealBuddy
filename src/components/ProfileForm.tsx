"use client";

import { useState } from "react";
import { saveProfile } from "@/app/actions";
import type { Equipment, Profile } from "@/lib/types";
import { btn } from "./ui";

const DIETS: [Profile["diet"], string, string][] = [
  ["veg", "🥦", "Vegetarian"],
  ["egg", "🥚", "Eggetarian"],
  ["vegan", "🌱", "Vegan"],
];
const EQUIPMENT: [Equipment, string][] = [
  ["stove", "Stove / induction"],
  ["pressure_cooker", "Pressure cooker"],
  ["mixie", "Mixie"],
  ["fridge", "Fridge"],
  ["microwave", "Microwave"],
  ["oven", "Oven"],
  ["air_fryer", "Air fryer"],
  ["kettle", "Kettle"],
];
const TIMES = [15, 30, 45];

const card = "flex flex-col gap-3 rounded-[22px] border border-line bg-white p-[22px]";
const heading = "m-0 font-display text-xl font-extrabold";
const pill = (on: boolean) =>
  `inline-flex h-[46px] cursor-pointer items-center gap-1.5 rounded-full border-2 px-4 text-sm font-bold ${
    on ? "border-ocean bg-ocean text-white" : "border-line bg-white text-ink hover:border-ocean/40"
  }`;
const tile = (on: boolean) =>
  `flex h-[46px] cursor-pointer items-center justify-center gap-1.5 rounded-[14px] border-2 text-sm ${
    on ? "border-ocean bg-ocean-tint font-extrabold" : "border-line bg-white font-bold hover:border-ocean/40"
  }`;

export default function ProfileForm({ profile, cuisines }: { profile: Profile; cuisines: string[] }) {
  const [diet, setDiet] = useState(profile.diet);
  const [picked, setPicked] = useState(new Set(profile.cuisines));
  const [spice, setSpice] = useState(profile.spice);
  const [time, setTime] = useState(profile.maxMinutes);
  const [kit, setKit] = useState(new Set<Equipment>(profile.equipment));
  const options = [...new Set([...cuisines, ...profile.cuisines])];

  const flip = <T,>(set: Set<T>, v: T) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    return next;
  };

  return (
    <form action={saveProfile} className="flex max-w-[1040px] flex-col gap-5">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] gap-4">
        <fieldset className={card}>
          <legend className="sr-only">Diet</legend>
          <h2 className={heading}>Diet</h2>
          <div className="flex flex-wrap gap-2">
            {DIETS.map(([value, icon, label]) => (
              <label key={value} className={pill(diet === value)}>
                <input type="radio" name="diet" value={value} checked={diet === value} onChange={() => setDiet(value)} className="sr-only" />
                <span aria-hidden="true">{icon}</span>
                {label}
              </label>
            ))}
          </div>
          <p className="m-0 text-[13px] text-muted">Meat and fish never appear in a plan.</p>
        </fieldset>

        <fieldset className={card}>
          <legend className="sr-only">Cuisines</legend>
          <h2 className={heading}>Cuisines</h2>
          {options.length ? (
            <div className="flex flex-wrap gap-2">
              {options.map((c) => (
                <label key={c} className={pill(picked.has(c))}>
                  <input
                    type="checkbox"
                    name="cuisines"
                    value={c}
                    checked={picked.has(c)}
                    onChange={() => setPicked(flip(picked, c))}
                    className="sr-only"
                  />
                  {c}
                </label>
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm text-muted">Cuisines appear here once you upload recipes.</p>
          )}
          <p className="m-0 text-[13px] text-muted">Pick none to mix everything.</p>
        </fieldset>

        <fieldset className={card}>
          <legend className="sr-only">Spice level and time</legend>
          <h2 className={heading}>Spice level</h2>
          <div className="grid grid-cols-3 gap-2">
            {([1, 2, 3] as const).map((s) => (
              <label key={s} className={`${tile(spice === s)} !h-16 flex-col !gap-0.5`}>
                <input type="radio" name="spice" value={s} checked={spice === s} onChange={() => setSpice(s)} className="sr-only" />
                <span aria-hidden="true">{"🌶️".repeat(s)}</span>
                {["Mild", "Medium", "Spicy"][s - 1]}
              </label>
            ))}
          </div>
          <h2 className={`${heading} mt-1.5`}>Time per meal</h2>
          <div className="grid grid-cols-3 gap-2">
            {TIMES.map((t) => (
              <label key={t} className={tile(time === t)}>
                <input type="radio" name="maxMinutes" value={t} checked={time === t} onChange={() => setTime(t)} className="sr-only" />
                Up to {t} min
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={card}>
          <legend className="sr-only">Your kitchen</legend>
          <h2 className={heading}>Your kitchen</h2>
          <div className="grid grid-cols-2 gap-2">
            {EQUIPMENT.map(([value, label]) => (
              <label
                key={value}
                className={`flex h-[46px] cursor-pointer items-center gap-2.5 rounded-[14px] border-2 px-3 text-sm font-bold ${
                  kit.has(value) ? "border-ocean bg-ocean-tint" : "border-line"
                }`}
              >
                <input
                  type="checkbox"
                  name="equipment"
                  value={value}
                  checked={kit.has(value)}
                  onChange={() => setKit(flip(kit, value))}
                  className="h-[18px] w-[18px] accent-ocean"
                />
                {label}
              </label>
            ))}
          </div>
          <p className="m-0 text-[13px] text-muted">With a fridge, curries can be cooked once and eaten twice.</p>
        </fieldset>

        <div className={card}>
          <label htmlFor="dislikes" className={heading}>Anything you don&apos;t eat?</label>
          <input
            id="dislikes"
            name="dislikes"
            defaultValue={profile.dislikes.join(", ")}
            placeholder="e.g. brinjal, bitter gourd"
            className="h-[46px] rounded-[14px] border-2 border-line px-3.5 text-[15px]"
          />
          <p className="m-0 text-[13px] text-muted">Separate with commas.</p>
        </div>

        <div className={card}>
          <label htmlFor="goal" className={heading}>Health goal</label>
          <select id="goal" name="goal" defaultValue={profile.goal} className="h-[46px] rounded-[14px] border-2 border-line bg-white px-3 text-[15px]">
            <option value="healthy">Eat healthy, not boring</option>
            <option value="protein">More protein</option>
            <option value="weight">Lose weight</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button name="replan" value="1" className={`${btn.primary} !h-[52px] !px-6 !text-base`}>
          Save and plan my week
        </button>
        <button name="replan" value="0" className={`${btn.secondary} !h-[52px]`}>
          Save only
        </button>
      </div>
    </form>
  );
}
