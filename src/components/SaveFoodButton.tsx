"use client";

import { useSyncExternalStore } from "react";
import { emptyHousehold, readHousehold, subscribeSavedFoods, toggleFoodInList } from "@/lib/saved-foods";

export function SaveFoodButton({ foodId, foodName }: { foodId: string; foodName: string }) {
  const household = useSyncExternalStore(subscribeSavedFoods, readHousehold, () => emptyHousehold);
  const active = household.profiles.find((list) => list.id === household.activeProfileId) ?? household.profiles[0];
  const ids = active.foodIds;
  const saved = ids.includes(foodId);

  function toggle() {
    toggleFoodInList(active.id, foodId);
  }

  return (
    <button className={`save-food-button ${saved ? "saved" : ""}`} type="button" onClick={toggle} aria-pressed={saved}>
      <span aria-hidden="true">{saved ? "✓" : "+"}</span> {saved ? `${foodName} saved to ${active.name}` : `Save ${foodName.toLowerCase()} to ${active.name}`}
    </button>
  );
}
