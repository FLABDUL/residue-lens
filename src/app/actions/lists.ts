"use server";

import { getDatabase } from "@/lib/db";
import { getOptionalUserId } from "@/lib/server-auth";
import type { HouseholdState } from "@/lib/saved-foods";

type SyncResult = { ok: boolean; message: string; household?: HouseholdState };

function validHousehold(value: HouseholdState) {
  return value.version === 2
    && value.profiles.length > 0
    && value.profiles.length <= 30
    && value.profiles.every((list) => list.id.length <= 80 && list.name.trim().length > 0 && list.name.length <= 30
      && list.foodIds.length <= 1000 && list.foodIds.every((foodId) => foodId.length <= 120));
}

export async function uploadHousehold(household: HouseholdState): Promise<SyncResult> {
  const userId = await getOptionalUserId();
  const sql = getDatabase();
  if (!userId) return { ok: false, message: "Sign in before syncing lists." };
  if (!sql) return { ok: false, message: "Cloud storage is not connected on this preview." };
  if (!validHousehold(household)) return { ok: false, message: "This list file is not valid." };
  await sql.begin(async (transaction) => {
    await transaction`DELETE FROM saved_lists WHERE user_id = ${userId}`;
    for (const [listIndex, list] of household.profiles.entries()) {
      await transaction`INSERT INTO saved_lists (id, user_id, name, position) VALUES (${list.id}, ${userId}, ${list.name.trim()}, ${listIndex})`;
      for (const [foodIndex, foodId] of list.foodIds.entries()) {
        await transaction`INSERT INTO saved_list_foods (user_id, list_id, food_id, position) VALUES (${userId}, ${list.id}, ${foodId}, ${foodIndex})`;
      }
    }
  });
  const foodCount = household.profiles.reduce((total, list) => total + list.foodIds.length, 0);
  const listLabel = `${household.profiles.length} list${household.profiles.length === 1 ? "" : "s"}`;
  if (foodCount === 0) {
    return {
      ok: true,
      message: `Saved ${listLabel}, but it contains no foods yet. Add foods with a star or “Save selected”, then upload again.`,
    };
  }
  return {
    ok: true,
    message: `Saved ${listLabel} with ${foodCount} food${foodCount === 1 ? "" : "s"} to your account.`,
  };
}

export async function downloadHousehold(): Promise<SyncResult> {
  const userId = await getOptionalUserId();
  const sql = getDatabase();
  if (!userId) return { ok: false, message: "Sign in before loading synced lists." };
  if (!sql) return { ok: false, message: "Cloud storage is not connected on this preview." };
  const [lists, foods] = await Promise.all([
    sql`SELECT id, name FROM saved_lists WHERE user_id = ${userId} ORDER BY position, created_at`,
    sql`SELECT list_id, food_id FROM saved_list_foods WHERE user_id = ${userId} ORDER BY list_id, position, created_at`,
  ]);
  if (!lists.length) return { ok: false, message: "No cloud lists have been saved yet." };
  const profiles = lists.map((list) => ({
    id: String(list.id),
    name: String(list.name),
    foodIds: foods.filter((food) => food.list_id === list.id).map((food) => String(food.food_id)),
  }));
  const foodCount = profiles.reduce((total, list) => total + list.foodIds.length, 0);
  return {
    ok: true,
    message: `Loaded ${profiles.length} list${profiles.length === 1 ? "" : "s"} with ${foodCount} food${foodCount === 1 ? "" : "s"} into this browser.`,
    household: { version: 2, activeProfileId: profiles[0].id, profiles },
  };
}

export async function deleteCloudLists(): Promise<SyncResult> {
  const userId = await getOptionalUserId();
  const sql = getDatabase();
  if (!userId) return { ok: false, message: "Sign in before deleting synced lists." };
  if (!sql) return { ok: false, message: "Cloud storage is not connected on this preview." };
  await sql`DELETE FROM saved_lists WHERE user_id = ${userId}`;
  return { ok: true, message: "Your synced lists were deleted. Lists in this browser were not changed." };
}
