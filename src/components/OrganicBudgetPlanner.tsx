"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import type { FoodRecord } from "@/data/types";
import { emptyHousehold, readHousehold, subscribeSavedFoods } from "@/lib/saved-foods";
import { organicComparable } from "@/lib/data-quality";
import { FoodVisual } from "./FoodVisual";

type Preference = { frequency: number; premium: number };
type Preferences = Record<string, Preference>;
const PLANNER_KEY = "residue-lens:organic-planner:v1";

function plannerSnapshot() {
  return window.localStorage.getItem(PLANNER_KEY) ?? "{}";
}

function subscribePlanner(callback: () => void) {
  const listener = (event: StorageEvent | Event) => {
    if (!(event instanceof StorageEvent) || event.key === PLANNER_KEY) callback();
  };
  window.addEventListener("storage", listener);
  window.addEventListener("residue-lens-planner", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("residue-lens-planner", listener);
  };
}

export function OrganicBudgetPlanner({ foods }: { foods: FoodRecord[] }) {
  const household = useSyncExternalStore(subscribeSavedFoods, readHousehold, () => emptyHousehold);
  const active = household.profiles.find((list) => list.id === household.activeProfileId) ?? household.profiles[0];
  const [budget, setBudget] = useState(20);
  const preferencesJson = useSyncExternalStore(subscribePlanner, plannerSnapshot, () => "{}");
  const preferences = useMemo<Preferences>(() => { try { return JSON.parse(preferencesJson); } catch { return {}; } }, [preferencesJson]);
  const candidates = useMemo(() => foods.filter((food) => active.foodIds.includes(food.id) && organicComparable(food)), [active.foodIds, foods]);

  function update(foodId: string, field: keyof Preference, value: number) {
    const next = { ...preferences, [foodId]: { frequency: preferences[foodId]?.frequency ?? 4, premium: preferences[foodId]?.premium ?? .5, [field]: Math.max(0, value) } };
    window.localStorage.setItem(PLANNER_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("residue-lens-planner"));
  }

  const plan = useMemo(() => {
    const ranked = candidates.map((food) => {
      const preference = preferences[food.id] ?? { frequency: 4, premium: .5 };
      const gap = Math.max(0, food.conventional.detectedPct - food.organic.detectedPct);
      const evidenceWeight = Math.min(1, food.organic.samples / 30);
      return { food, ...preference, gap, value: gap * evidenceWeight / Math.max(.01, preference.premium) };
    }).toSorted((a, b) => b.value - a.value);
    return ranked.reduce<{ remaining: number; rows: Array<(typeof ranked)[number] & { swaps: number; cost: number }> }>((result, item) => {
      const swaps = item.premium > 0 ? Math.min(item.frequency, Math.floor((result.remaining + .0001) / item.premium)) : item.frequency;
      const cost = swaps * item.premium;
      return { remaining: result.remaining - cost, rows: swaps > 0 ? [...result.rows, { ...item, swaps, cost }] : result.rows };
    }, { remaining: budget, rows: [] }).rows;
  }, [budget, candidates, preferences]);

  const spent = plan.reduce((total, item) => total + item.cost, 0);
  return <section className="planner" aria-labelledby="planner-title">
    <div className="planner-heading"><div><p className="eyebrow">Research preview</p><h2 id="planner-title">Organic budget planner</h2><p>Allocate a monthly budget across foods you already save. The ordering uses the observed conventional-to-organic detection gap, sample strength and your estimated price premium. It is not a health or toxicity score.</p></div><label>Monthly budget <span>£</span><input type="number" min="0" max="1000" step="1" value={budget} onChange={(event) => setBudget(Number(event.target.value))} /></label></div>
    {!candidates.length ? <div className="planner-empty"><p>No saved foods currently have enough organic samples for a comparison.</p><Link className="primary-button" href="/compare">Add comparable foods</Link></div> : <>
      <div className="planner-inputs">{candidates.map((food) => { const preference = preferences[food.id] ?? { frequency: 4, premium: .5 }; return <article key={food.id}><FoodVisual canonicalId={food.canonicalId} category={food.category} name={food.name} decorative /><div><strong>{food.name}</strong><small>{food.organic.samples} organic samples · {(food.conventional.detectedPct - food.organic.detectedPct).toFixed(1)} point observed gap</small></div><label>Buys/month<input type="number" min="0" max="100" value={preference.frequency} onChange={(event) => update(food.id, "frequency", Number(event.target.value))} /></label><label>Extra £ each<input type="number" min="0" max="100" step="0.1" value={preference.premium} onChange={(event) => update(food.id, "premium", Number(event.target.value))} /></label></article>; })}</div>
      <div className="planner-result"><div><p className="eyebrow">Suggested allocation</p><strong>£{spent.toFixed(2)} <small>of £{budget.toFixed(2)}</small></strong></div><ol>{plan.map((item) => <li key={item.food.id}><FoodVisual canonicalId={item.food.canonicalId} category={item.food.category} name={item.food.name} decorative /><span><strong>{item.food.name}</strong><small>{item.swaps} organic purchase{item.swaps === 1 ? "" : "s"} · estimated £{item.cost.toFixed(2)}</small></span><b>{item.gap.toFixed(1)} pt gap</b></li>)}</ol></div>
    </>}
    <p className="planner-note">Prices are your estimates. Monitoring samples are targeted and may not represent every product sold. This planner helps express a personal residue-reduction preference; it does not estimate health benefit.</p>
  </section>;
}
