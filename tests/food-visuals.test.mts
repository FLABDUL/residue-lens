import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import dataset from "../src/data/global-pesticides-latest.json" with { type: "json" };

type FoodArtProfile = {
  id: string;
  name: string;
  subject: string;
  form: string;
  accent: string;
  detail: string;
  monogram: string;
};

test("every canonical food has a truthful semantic artwork profile", () => {
  const profilePath = resolve("src", "data", "food-art-profiles.json");
  assert.equal(existsSync(profilePath), true, "food artwork profiles have not been generated");
  const profiles = JSON.parse(readFileSync(profilePath, "utf8")) as FoodArtProfile[];
  const foods = new Map<string, Set<string>>();
  for (const food of dataset.foods) {
    const names = foods.get(food.canonicalId) ?? new Set<string>();
    names.add(food.name);
    foods.set(food.canonicalId, names);
  }
  assert.equal(profiles.length, foods.size);
  assert.deepEqual(profiles.map((profile) => profile.id).sort(), [...foods.keys()].sort());

  const forbiddenGenericSubjects = new Set(["round", "leaf", "cluster", "root", "protein", "bowl"]);
  const signatures = new Set<string>();
  for (const profile of profiles) {
    assert.equal(foods.get(profile.id)?.has(profile.name), true, `${profile.id} uses an unknown display name`);
    assert.equal(forbiddenGenericSubjects.has(profile.subject), false, `${profile.id} uses a misleading generic subject`);
    assert.match(profile.monogram, /^[A-Z0-9]{1,3}$/);
    const signature = [profile.subject, profile.form, profile.accent, profile.detail, profile.monogram].join("|");
    assert.equal(signatures.has(signature), false, `duplicate semantic artwork profile: ${signature}`);
    signatures.add(signature);
  }

  const byId = new Map(profiles.map((profile) => [profile.id, profile]));
  const expectedSubjects = {
    "olive-oil": "olive-oil-bottle",
    "plant-based-chocolate": "chocolate-bar",
    "plant-based-protein": "protein-pack",
    "frozen-fruit": "mixed-fruit-pack",
    grapefruit: "grapefruit-half",
    grapes: "grape-bunch",
    "chinese-cabbage": "chinese-cabbage",
    courgettes: "courgette",
    cucumbers: "cucumber",
    "frozen-vegetables": "mixed-vegetable-pack",
    "garden-peas": "pea-pod",
  } as const;
  for (const [id, subject] of Object.entries(expectedSubjects)) {
    assert.equal(byId.get(id)?.subject, subject, `${id} should use ${subject}`);
  }
});

test("every canonical food has one safe and distinct static SVG", () => {
  const ids = [...new Set(dataset.foods.map((food) => food.canonicalId))].sort();
  assert.equal(ids.length, 795);
  const hashes = new Set<string>();

  for (const id of ids) {
    const path = resolve("public", "food-art", `${id}.svg`);
    assert.equal(existsSync(path), true, `missing artwork for ${id}`);
    const svg = readFileSync(path, "utf8");
    assert.match(svg, /^<svg[^>]+viewBox="0 0 96 96"/);
    assert.match(svg, new RegExp(`<title>[^<]+<\\/title>`));
    assert.match(svg, new RegExp(`data-subject="[^"]+" data-rendered-subject="[^"]+"`));
    assert.doesNotMatch(svg, /<script|javascript:|(?:href|xlink:href)=["']https?:/i);
    hashes.add(createHash("sha256").update(svg).digest("hex"));
  }

  assert.equal(hashes.size, ids.length, "each canonical food needs distinct artwork");

  for (const [id, subject] of Object.entries({
    "sweet-peppers": "sweet-pepper",
    "apple-juice": "drink-glass",
    "plant-based-chocolate": "chocolate-bar",
  })) {
    const svg = readFileSync(resolve("public", "food-art", `${id}.svg`), "utf8");
    assert.match(svg, new RegExp(`data-rendered-subject="${subject}"`));
  }
});
