"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Dataset, FoodRecord, Metric } from "@/data/types";
import { ComparisonChart } from "./ComparisonChart";
import { ResidueTable } from "./ResidueTable";
import { FoodVisual } from "./FoodVisual";
import { SiteFooter, SiteHeader } from "./SiteChrome";
import { coverageLabel } from "@/lib/data-quality";
import { addProfile, emptyHousehold, readHousehold, setActiveProfile, subscribeSavedFoods, toggleFoodInList, writeFoodsToList } from "@/lib/saved-foods";
import { track } from "@vercel/analytics";

const DEFAULT_FOODS = ["grapes", "broccoli", "garlic"];
const MAX_SELECTED = 7;

const METRICS: Array<{ id: Metric; label: string; shortLabel: string }> = [
  { id: "detectedPct", label: "Any residue", shortLabel: "Detected" },
  { id: "residueFreePct", label: "No quantified residue", shortLabel: "None found" },
  { id: "multiplePct", label: "Multiple residues", shortLabel: "Multiple" },
  { id: "aboveMrlPct", label: "Above MRL", shortLabel: "Above MRL" },
  { id: "medianResidues", label: "Median residue count", shortLabel: "Typical count" },
  { id: "organic", label: "Organic comparison", shortLabel: "Organic" },
];
const PICKER_STORAGE_KEY = "residue-lens:picker-collapsed";
const PICKER_EVENT = "residue-lens:picker-change";

function readPickerPreference() {
  try {
    const stored = window.localStorage.getItem(PICKER_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

function subscribePickerPreference(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(PICKER_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(PICKER_EVENT, notify);
  };
}

export function PesticideExplorer({
  dataset,
  initialSelectedIds = DEFAULT_FOODS,
  initialMetric = "detectedPct",
  initialProgramme = "uk-prif",
  initialRegion = "GB",
  initialIsExample = false,
}: {
  dataset: Dataset;
  initialSelectedIds?: string[];
  initialMetric?: Metric;
  initialProgramme?: string;
  initialRegion?: string;
  initialIsExample?: boolean;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [metric, setMetric] = useState<Metric>(initialMetric);
  const [focusedFoodId, setFocusedFoodId] = useState(initialSelectedIds[0] ?? dataset.foods[0].id);
  const [search, setSearch] = useState("");
  const [programmeFilter, setProgrammeFilter] = useState(initialProgramme);
  const [region, setRegion] = useState(initialRegion);
  const [category, setCategory] = useState("All foods");
  const [evidence, setEvidence] = useState<"all" | "broader" | "organic">("all");
  const [notice, setNotice] = useState("");
  const [newListName, setNewListName] = useState("");
  const [showExampleNote, setShowExampleNote] = useState(initialIsExample);
  const pickerCollapsed = useSyncExternalStore(subscribePickerPreference, readPickerPreference, () => true);
  const household = useSyncExternalStore(subscribeSavedFoods, readHousehold, () => emptyHousehold);
  const activeList = household.profiles.find((profile) => profile.id === household.activeProfileId) ?? household.profiles[0];
  const savedIds = activeList?.foodIds ?? [];

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("foods", selectedIds.join(","));
    url.searchParams.set("metric", metric);
    url.searchParams.set("programme", programmeFilter);
    if (programmeFilter === "uk-prif") url.searchParams.set("region", region); else url.searchParams.delete("region");
    window.history.replaceState({}, "", url);
  }, [metric, programmeFilter, region, selectedIds]);

  function setPickerPreference(collapsed: boolean) {
    try {
      window.localStorage.setItem(PICKER_STORAGE_KEY, String(collapsed));
      window.dispatchEvent(new Event(PICKER_EVENT));
    } catch {
      // Privacy modes may disable storage; expanded remains the safe default.
    }
  }

  const selectedFoods = useMemo(
    () => dataset.foods.filter((food) => selectedIds.includes(food.id) && food.programmeId === programmeFilter && (region === "all" || food.region === region)),
    [dataset.foods, programmeFilter, region, selectedIds],
  );
  const referenceFoods = useMemo(
    () => dataset.foods.filter((food) => food.programmeId === programmeFilter && (region === "all" || food.region === region)),
    [dataset.foods, programmeFilter, region],
  );
  const focusedFood =
    dataset.foods.find((food) => food.id === focusedFoodId) ?? selectedFoods[0] ?? dataset.foods[0];

  const filteredFoods = useMemo(() => {
    const term = search.trim().toLowerCase();
    return dataset.foods.filter((food) =>
      food.programmeId === programmeFilter
      && (region === "all" || food.region === region)
      && (category === "All foods" || food.category === category)
      && (evidence === "all" || (evidence === "broader" ? food.conventional.samples >= 50 : food.organic.samples >= 5))
      && (!term || food.name.toLowerCase().includes(term)),
    );
  }, [category, dataset.foods, evidence, programmeFilter, region, search]);

  const categories = useMemo(
    () => Array.from(new Set(dataset.foods.map((food) => food.category))),
    [dataset.foods],
  );
  const programmeRegions = useMemo(() => Array.from(new Map(dataset.foods.filter((food) => food.programmeId === programmeFilter).map((food) => [food.region, food.market ?? food.region])).entries()).map(([id, name]) => ({ id, name })).toSorted((a, b) => a.name.localeCompare(b.name)), [dataset.foods, programmeFilter]);

  function toggleFood(food: FoodRecord) {
    setNotice("");
    setShowExampleNote(false);
    if (selectedIds.includes(food.id)) {
      const next = selectedIds.filter((id) => id !== food.id);
      setSelectedIds(next);
      if (focusedFoodId === food.id && next.length) setFocusedFoodId(next[0]);
      return;
    }
    if (selectedIds.length >= MAX_SELECTED) {
      setNotice(`Choose up to ${MAX_SELECTED} foods so the chart stays readable.`);
      return;
    }
    if (search.trim()) track("food_search_result_selected", { food: food.id, resultCount: filteredFoods.length });
    setFocusedFoodId(food.id);
    setSelectedIds([...selectedIds, food.id]);
  }

  function changeProgramme(value: string) {
    const allMatching = dataset.foods.filter((food) => food.programmeId === value);
    const defaultRegion = value === "uk-prif" ? "GB" : value === "efsa-controls" ? allMatching.toSorted((a, b) => (a.market ?? "").localeCompare(b.market ?? ""))[0]?.region ?? "all" : "all";
    const matching = allMatching.filter((food) => defaultRegion === "all" || food.region === defaultRegion);
    setProgrammeFilter(value);
    setRegion(defaultRegion);
    setSelectedIds(matching.slice(0, 5).map((food) => food.id));
    if (matching[0]) setFocusedFoodId(matching[0].id);
    setNotice("Monitoring programmes are shown separately because their sampling and regulations differ.");
    setShowExampleNote(false);
  }

  function changeRegion(value: string) {
    const matching = dataset.foods.filter((food) => food.programmeId === programmeFilter && (value === "all" || food.region === value));
    setRegion(value);
    setSelectedIds(matching.slice(0, 5).map((food) => food.id));
    if (matching[0]) setFocusedFoodId(matching[0].id);
    setShowExampleNote(false);
  }

  function toggleSaved(food: FoodRecord) {
    const added = toggleFoodInList(activeList.id, food.id);
    setNotice(added ? `${food.name} saved to “${activeList.name}”.` : `${food.name} removed from “${activeList.name}”.`);
    if (added) track("food_saved", { food: food.id, year: food.year });
  }

  function saveSelected() {
    const additions = selectedIds.filter((id) => !savedIds.includes(id));
    writeFoodsToList(activeList.id, [...savedIds, ...additions]);
    setNotice(additions.length ? `${additions.length} selected food${additions.length === 1 ? "" : "s"} saved to “${activeList.name}”.` : `These foods are already in “${activeList.name}”.`);
    if (additions.length) track("comparison_saved", { count: additions.length });
  }

  function createList() {
    const name = newListName.trim();
    if (!name) return;
    addProfile(name);
    setNewListName("");
    setNotice(`Created “${name}”. New saves will go to this list.`);
    track("household_profile_created");
  }

  async function shareComparison() {
    const url = window.location.href;
    const shareData: ShareData = {
      title: "Residue Lens comparison",
      text: "Compare pesticide-residue monitoring results for these foods.",
      url,
    };

    if (navigator.share && (navigator.canShare?.(shareData) ?? true)) {
      try {
        await navigator.share(shareData);
        setNotice("Comparison shared.");
        track("comparison_shared", { method: "native" });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setNotice("Sharing cancelled.");
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setNotice("Comparison link copied.");
      track("comparison_shared", { method: "clipboard" });
    } catch {
      setNotice("Copy the current address to share this comparison.");
    }
  }

  return (
    <>
      <SiteHeader current="compare" />

      <main id="top">
        <section className="explorer-shell" id="compare">
          <div className="explorer-topline">
            <div>
              <p className="eyebrow">Interactive comparison</p>
              <h1>Choose foods. Change the question.</h1>
            </div>
            <button className="share-button" type="button" onClick={shareComparison}>
              <span aria-hidden="true">↗</span> Share comparison
            </button>
          </div>

          <div className={`explorer-grid ${pickerCollapsed ? "picker-collapsed" : ""}`}>
            <aside className="food-picker" aria-label="Food selection">
              <button
                className="picker-collapse"
                type="button"
                aria-expanded={!pickerCollapsed}
                aria-label={pickerCollapsed ? `Choose foods (${selectedIds.length})` : "Collapse food chooser"}
                onClick={() => setPickerPreference(!pickerCollapsed)}
              >
                <span aria-hidden="true">{pickerCollapsed ? "→" : "←"}</span>
                <strong>{pickerCollapsed ? `Choose foods (${selectedIds.length})` : "Hide chooser"}</strong>
              </button>
              {!pickerCollapsed ? <>
              <label className="search-field">
                <span className="sr-only">Search foods</span>
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Search foods…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <details className="catalogue-more">
                <summary>More filters <span>source, place and evidence</span></summary>
                <div className="catalogue-filters" aria-label="Filter the catalogue">
                  <label><span>Programme</span><select value={programmeFilter} onChange={(event) => changeProgramme(event.target.value)}>{dataset.meta.programmes?.map((programme) => <option value={programme.id} key={programme.id}>{programme.market} · {programme.name}</option>)}</select></label>
                  {programmeFilter === "uk-prif" ? <label><span>Region</span><select value={region} onChange={(event) => changeRegion(event.target.value)}><option value="GB">Great Britain</option><option value="NI">Northern Ireland</option><option value="all">Both regions</option></select></label> : null}
                  {programmeFilter === "efsa-controls" ? <label><span>Country</span><select value={region} onChange={(event) => changeRegion(event.target.value)}>{programmeRegions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label> : null}
                  <label><span>Food type</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All foods</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span>Evidence</span><select value={evidence} onChange={(event) => setEvidence(event.target.value as "all" | "broader" | "organic")}><option value="all">Any sample size</option><option value="broader">50+ standard-grown samples</option><option value="organic">Organic comparison available</option></select></label>
                </div>
              </details>
              <div className="save-destination">
                <label htmlFor="save-list">Save foods to</label>
                <select id="save-list" value={activeList.id} onChange={(event) => setActiveProfile(event.target.value)}>
                  {household.profiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.name}</option>)}
                </select>
                <details>
                  <summary>New list</summary>
                  <div><input value={newListName} maxLength={30} onChange={(event) => setNewListName(event.target.value)} placeholder="e.g. Weekly shop" /><button type="button" onClick={createList}>Create</button></div>
                </details>
              </div>
              <p className="list-helper"><strong>Making your list:</strong> choose a destination above. “Save selected” adds the comparison; stars add one food. Lists stay on this device unless you sign in and upload them.</p>
              <div className="selection-meta">
                <span>{selectedIds.length} selected</span>
                <span className="selection-actions"><button type="button" onClick={saveSelected}>Save to {activeList.name}</button><button type="button" onClick={() => { setSelectedIds([]); setShowExampleNote(false); }}>Clear</button></span>
              </div>

              <div className="food-list">
                {categories.map((category) => {
                  const categoryFoods = filteredFoods.filter((food) => food.category === category);
                  return categoryFoods.length ? (
                    <section key={category}>
                      <h3>{category}</h3>
                      {categoryFoods.map((food) => {
                        const checked = selectedIds.includes(food.id);
                        return (
                          <div className={`food-option-wrap ${checked ? "selected" : ""}`} key={food.id}>
                            <label className="food-option">
                              <input type="checkbox" checked={checked} onChange={() => toggleFood(food)} />
                              <span className="custom-check" aria-hidden="true">{checked ? "✓" : ""}</span>
                              <FoodVisual canonicalId={food.canonicalId} category={food.category} name={food.name} decorative />
                              <span><strong>{food.name}</strong><small>{food.market ?? food.region} · {food.year} {food.period} · {food.conventional.samples} standard-grown · {coverageLabel(food.conventional.samples).level}</small></span>
                            </label>
                            <button className="inline-save" type="button" title={`${savedIds.includes(food.id) ? "Remove from" : "Save to"} ${activeList.name}`} aria-label={`${savedIds.includes(food.id) ? "Remove" : "Save"} ${food.name} ${savedIds.includes(food.id) ? "from" : "to"} ${activeList.name}`} aria-pressed={savedIds.includes(food.id)} onClick={() => toggleSaved(food)}>{savedIds.includes(food.id) ? "★" : "☆"}</button>
                          </div>
                        );
                      })}
                    </section>
                  ) : null;
                })}
                {filteredFoods.length === 0 ? <p className="no-search-results">No matching survey entries. Try a broader dataset or evidence filter.</p> : null}
              </div>
              </> : null}
            </aside>

            <div className="chart-panel">
              {showExampleNote ? <p className="comparison-example">Example comparison — choose your own foods.</p> : null}
              <div className="measure-picker" aria-label="Choose what to compare">
                <span>Compare by</span>
                <div className="metric-tabs" role="group" aria-label="Comparison measures">
                  {METRICS.map((item) => (
                    <button type="button" key={item.id} data-metric={item.id} className={metric === item.id ? "active" : ""} onClick={() => setMetric(item.id)} aria-pressed={metric === item.id}>
                      <span className="metric-full">{item.label}</span><span className="metric-short">{item.shortLabel}</span>
                    </button>
                  ))}
                </div>
              </div>
              <ComparisonChart
                foods={selectedFoods}
                referenceFoods={referenceFoods}
                metric={metric}
                focusedFoodId={focusedFood.id}
                onFocus={setFocusedFoodId}
              />
              <div className="chart-footnote">
                <span><i />Programmes, regions and years are not pooled.</span>
                <a href="#details">View residue details for {focusedFood.name} ↓</a>
              </div>
            </div>
          </div>
          <div className="notice" role="status" aria-live="polite">{notice}</div>
        </section>

        <div id="details">
          <ResidueTable food={focusedFood} />
        </div>
        <nav className="compare-support-links" aria-label="Comparison help">
          <a href="/feedback">Was anything unclear or surprising? Tell me.</a>
          <a href="/guides">Understand the results</a>
          <a href="/methodology">Read the methodology</a>
        </nav>
      </main>

      <SiteFooter />
    </>
  );
}
