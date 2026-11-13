export const SAVED_FOODS_KEY = "residue-lens:saved-foods:v1";
export const HOUSEHOLD_KEY = "residue-lens:household:v2";

export type HouseholdProfile = { id: string; name: string; foodIds: string[] };
export type HouseholdState = { version: 2; activeProfileId: string; profiles: HouseholdProfile[] };

const emptyProfile: HouseholdProfile = { id: "mine", name: "My list", foodIds: [] };
export const emptyHousehold: HouseholdState = { version: 2, activeProfileId: "mine", profiles: [emptyProfile] };
export const emptySavedFoods: string[] = [];
let cache: HouseholdState = emptyHousehold;
let loaded = false;

function validState(value: unknown): value is HouseholdState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<HouseholdState>;
  return candidate.version === 2 && typeof candidate.activeProfileId === "string" && Array.isArray(candidate.profiles)
    && candidate.profiles.every((profile) => profile && typeof profile.id === "string" && typeof profile.name === "string" && Array.isArray(profile.foodIds) && profile.foodIds.every((id) => typeof id === "string"));
}

function normaliseState(state: HouseholdState): HouseholdState {
  const profiles = state.profiles.length ? state.profiles.map((profile) => ({ ...profile, name: profile.name.trim().slice(0, 30) || "Household member", foodIds: [...new Set(profile.foodIds)] })) : [emptyProfile];
  const activeProfileId = profiles.some((profile) => profile.id === state.activeProfileId) ? state.activeProfileId : profiles[0].id;
  return { version: 2, activeProfileId, profiles };
}

export function readHousehold(): HouseholdState {
  if (typeof window === "undefined") return cache;
  if (loaded) return cache;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HOUSEHOLD_KEY) ?? "null");
    if (validState(parsed)) {
      cache = normaliseState(parsed);
    } else {
      const legacy = JSON.parse(window.localStorage.getItem(SAVED_FOODS_KEY) ?? "[]");
      const foodIds = Array.isArray(legacy) ? legacy.filter((value): value is string => typeof value === "string") : [];
      cache = { ...emptyHousehold, profiles: [{ ...emptyProfile, foodIds }] };
    }
  } catch {
    cache = emptyHousehold;
  }
  loaded = true;
  return cache;
}

export function writeHousehold(state: HouseholdState) {
  cache = normaliseState(state);
  loaded = true;
  window.localStorage.setItem(HOUSEHOLD_KEY, JSON.stringify(cache));
  window.dispatchEvent(new CustomEvent("residue-lens:saved-foods"));
}

export function readSavedFoods(): string[] {
  const state = readHousehold();
  return state.profiles.find((profile) => profile.id === state.activeProfileId)?.foodIds ?? emptySavedFoods;
}

export function writeSavedFoods(ids: string[]) {
  const state = readHousehold();
  writeHousehold({ ...state, profiles: state.profiles.map((profile) => profile.id === state.activeProfileId ? { ...profile, foodIds: ids } : profile) });
}

export function writeFoodsToList(listId: string, ids: string[]) {
  const state = readHousehold();
  if (!state.profiles.some((profile) => profile.id === listId)) return;
  writeHousehold({
    ...state,
    activeProfileId: listId,
    profiles: state.profiles.map((profile) => profile.id === listId
      ? { ...profile, foodIds: [...new Set(ids)] }
      : profile),
  });
}

export function toggleFoodInList(listId: string, foodId: string) {
  const state = readHousehold();
  const list = state.profiles.find((profile) => profile.id === listId);
  if (!list) return false;
  const alreadySaved = list.foodIds.includes(foodId);
  writeFoodsToList(listId, alreadySaved
    ? list.foodIds.filter((id) => id !== foodId)
    : [...list.foodIds, foodId]);
  return !alreadySaved;
}

export function setActiveProfile(id: string) {
  const state = readHousehold();
  if (state.profiles.some((profile) => profile.id === id)) writeHousehold({ ...state, activeProfileId: id });
}

export function addProfile(name: string) {
  const state = readHousehold();
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `profile-${Date.now()}`;
  writeHousehold({ ...state, activeProfileId: id, profiles: [...state.profiles, { id, name, foodIds: [] }] });
}

export function subscribeSavedFoods(onChange: () => void) {
  const localChange = () => onChange();
  const storageChange = (event: StorageEvent) => {
    if (event.key === HOUSEHOLD_KEY || event.key === SAVED_FOODS_KEY) { loaded = false; onChange(); }
  };
  window.addEventListener("residue-lens:saved-foods", localChange);
  window.addEventListener("storage", storageChange);
  return () => { window.removeEventListener("residue-lens:saved-foods", localChange); window.removeEventListener("storage", storageChange); };
}
