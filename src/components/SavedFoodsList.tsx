"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import type { FoodRecord } from "@/data/types";
import { organicComparable } from "@/lib/data-quality";
import { addProfile, emptyHousehold, readHousehold, setActiveProfile, subscribeSavedFoods, writeHousehold, writeSavedFoods, type HouseholdState } from "@/lib/saved-foods";
import { track } from "@vercel/analytics";
import { FoodVisual } from "./FoodVisual";

export function SavedFoodsList({ foods }: { foods: FoodRecord[] }) {
  const household = useSyncExternalStore(subscribeSavedFoods, readHousehold, () => emptyHousehold);
  const ids = useMemo(() => household.profiles.find((profile) => profile.id === household.activeProfileId)?.foodIds ?? [], [household]);
  const [newProfileName, setNewProfileName] = useState("");
  const [shoppingMode, setShoppingMode] = useState(false);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [portabilityStatus, setPortabilityStatus] = useState("");

  const saved = useMemo(
    () => foods.filter((food) => ids.includes(food.id)).toSorted((a, b) => {
      const gapA = organicComparable(a) ? a.conventional.detectedPct - a.organic.detectedPct : -1;
      const gapB = organicComparable(b) ? b.conventional.detectedPct - b.organic.detectedPct : -1;
      return gapB - gapA;
    }),
    [foods, ids],
  );

  function remove(id: string) {
    const next = ids.filter((savedId) => savedId !== id);
    writeSavedFoods(next);
  }

  function downloadCsv() {
    const rows = [
      ["Food", "Survey year", "Conventional samples", "Any residue (%)", "Multiple residues (%)", "Organic samples", "Organic any residue (%)"],
      ...saved.map((food) => [food.name, food.year, food.conventional.samples, food.conventional.detectedPct, food.conventional.multiplePct, food.organic.samples, organicComparable(food) ? food.organic.detectedPct : "withheld"]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "residue-lens-shopping-list.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    track("list_exported", { format: "csv", count: saved.length });
  }

  function exportHousehold() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(household, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "residue-lens-household.json"; anchor.click(); URL.revokeObjectURL(url);
    setPortabilityStatus("Portable household file downloaded."); track("list_exported", { format: "json", count: saved.length });
  }

  async function importHousehold(file: File | undefined) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as HouseholdState;
      if (parsed.version !== 2 || !Array.isArray(parsed.profiles) || !parsed.profiles.every((profile) => typeof profile?.id === "string" && typeof profile?.name === "string" && Array.isArray(profile.foodIds))) throw new Error("Invalid file");
      writeHousehold(parsed); setPortabilityStatus("Household lists imported into this browser."); track("list_imported", { profiles: parsed.profiles.length });
    } catch { setPortabilityStatus("That file is not a valid Residue Lens household export."); }
  }

  function createProfile() {
    const name = newProfileName.trim(); if (!name) return; addProfile(name); setNewProfileName(""); track("household_profile_created");
  }

  const profileControls = (
    <section className="household-bar" aria-label="Household profiles">
      <div><label htmlFor="profile-select">Viewing list</label><select id="profile-select" value={household.activeProfileId} onChange={(event) => setActiveProfile(event.target.value)}>{household.profiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.name}</option>)}</select></div>
      <div className="profile-create"><input value={newProfileName} onChange={(event) => setNewProfileName(event.target.value)} placeholder="e.g. Weekly shop" maxLength={30} /><button type="button" onClick={createProfile}>Create list</button></div>
      <div className="profile-portability"><button type="button" onClick={exportHousehold}>Export</button><label className="import-button">Import<input type="file" accept="application/json,.json" onChange={(event) => importHousehold(event.target.files?.[0])} /></label></div>
      <p>Lists stay in this browser. Export them to move between devices. New saves from the explorer go to the list selected here.</p>
      <p className="portability-status" role="status" aria-live="polite">{portabilityStatus}</p>
    </section>
  );

  if (!saved.length) {
    return (
      <div>
        {profileControls}
        <div className="saved-empty"><span aria-hidden="true">＋</span><h2>Your list is empty</h2><p>Open the explorer, select this list as the destination, then add foods with “Save selected” or a star.</p><Link className="primary-button" href="/compare">Add foods to this list</Link></div>
      </div>
    );
  }

  return (
    <div className={shoppingMode ? "shopping-mode" : ""}>
      {profileControls}
      <div className="saved-actions">
        <p>{saved.length} saved food{saved.length === 1 ? "" : "s"}, ordered by the largest comparable organic detection gap.</p>
        <div><button type="button" onClick={() => setShoppingMode((value) => !value)}>{shoppingMode ? "Exit shopping mode" : "Shopping mode"}</button><button type="button" onClick={downloadCsv}>Download CSV</button></div>
      </div>
      <div className="saved-grid">
        {saved.map((food, index) => {
          const comparable = organicComparable(food);
          const gap = comparable ? Math.max(0, food.conventional.detectedPct - food.organic.detectedPct) : null;
          return (
            <article className="saved-card" key={food.id}>
              {shoppingMode ? <input className="shopping-check" type="checkbox" checked={checkedIds.includes(food.id)} onChange={() => setCheckedIds((current) => current.includes(food.id) ? current.filter((id) => id !== food.id) : [...current, food.id])} aria-label={`Mark ${food.name} as picked up`} /> : null}
              <div className="saved-leading"><FoodVisual canonicalId={food.canonicalId} category={food.category} name={food.name} decorative /><span className="saved-rank">{String(index + 1).padStart(2, "0")}</span></div>
              <div><p className="eyebrow">{food.category} · {food.year} survey</p><h2><Link href={`/foods/${food.id}`}>{food.name}</Link></h2>
                <p>{food.conventional.detectedPct}% of {food.conventional.samples} conventional samples had a residue detected.</p>
                <strong>{gap === null ? "Organic comparison unavailable" : `${gap.toFixed(1)} point organic gap`}</strong>
              </div>
              <button className="remove-saved" type="button" onClick={() => remove(food.id)}>Remove</button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
