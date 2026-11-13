import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import dataset from "../src/data/global-pesticides-latest.json" with { type: "json" };

const OUTPUT = new URL("../public/food-art/", import.meta.url);
const PROFILE_OUTPUT = new URL("../src/data/food-art-profiles.json", import.meta.url);
const ARTIFACT_OUTPUT = new URL("../artifacts/", import.meta.url);
const palette = {
  forest: "#124c3b", leaf: "#2d8b68", mint: "#bfe5d1", cream: "#fff9ec",
  gold: "#e2a84b", coral: "#d45e4c", berry: "#76507c", sky: "#75a7b8",
};
const accents = ["leaf", "gold", "coral", "berry", "sky", "mint"];
const escapeXml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const hash = (value) => [...value].reduce((total, character) => Math.imul(total ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261);

function subjectFor(id, category) {
  const rules = [
    [/^olive-oil$|olive.*oil/, "olive-oil-bottle"],
    [/plant-based-chocolate|\bchocolate\b|cocoa|cacao/, "chocolate-bar"],
    [/plant-based-protein|protein.*plant|tofu|tempeh/, "protein-pack"],
    [/^frozen-fruit$|mixed.*fruit|fruit.*mix/, "mixed-fruit-pack"],
    [/^frozen-vegetables$|mixed.*vegetable|vegetable.*mix/, "mixed-vegetable-pack"],
    [/grapefruit/, "grapefruit-half"],
    [/\bgrapes?\b|table-grapes/, "grape-bunch"],
    [/chinese-cabbage|pak-choi|bok-choy/, "chinese-cabbage"],
    [/courgette|zucchini/, "courgette"],
    [/cucumber|gherkin/, "cucumber"],
    [/garden-peas|green-peas|\bpeas?\b/, "pea-pod"],
    [/citrus|chinotto|pomelo/, "citrus-half"],
    [/orange|mandarin|clementine|tangerine|satsuma/, "orange-half"],
    [/lemon/, "lemon-half"],
    [/lime/, "lime-half"],
    [/apple|cider/, "apple"],
    [/pear/, "pear"],
    [/banana|plantain/, "banana"],
    [/strawber/, "strawberry"],
    [/raspber/, "raspberry"],
    [/blueber/, "blueberry"],
    [/blackber|blackcurrant|redcurrant|gooseber|cranber|berry/, "berries"],
    [/cherr/, "cherries"],
    [/peach|nectarine|apricot|plum/, "stone-fruit"],
    [/pineapple/, "pineapple"],
    [/mango/, "mango"],
    [/papaya|pawpaw/, "papaya"],
    [/kiwi/, "kiwi-half"],
    [/melon|watermelon|cantaloupe/, "melon-slice"],
    [/avocado/, "avocado-half"],
    [/pomegranate/, "pomegranate-half"],
    [/fig/, "fig-half"],
    [/date/, "dates"],
    [/coconut/, "coconut-half"],
    [/tomato/, "tomato"],
    [/sweet-pepper|bell-pepper|capsicum/, "sweet-pepper"],
    [/chilli|chili|hot-pepper/, "chilli"],
    [/aubergine|eggplant/, "aubergine"],
    [/broccoli/, "broccoli"],
    [/cauliflower/, "cauliflower"],
    [/brussels?/, "brussels-sprouts"],
    [/cabbage/, "round-cabbage"],
    [/lettuce/, "lettuce"],
    [/spinach/, "spinach"],
    [/kale|spring-greens|vine-leaves/, "leafy-greens"],
    [/celery|celeriac/, "celery"],
    [/asparagus/, "asparagus"],
    [/leek/, "leek"],
    [/spring-onion|scallion/, "spring-onions"],
    [/onion|shallot/, "onion"],
    [/garlic/, "garlic-bulb"],
    [/carrot/, "carrot"],
    [/sweet-potato|yam/, "sweet-potato"],
    [/potato|crisps|chips/, "potato"],
    [/beetroot|beet/, "beetroot"],
    [/parsnip/, "parsnip"],
    [/radish/, "radish"],
    [/turnip|swede/, "turnip"],
    [/ginger/, "ginger-root"],
    [/turmeric/, "turmeric-root"],
    [/mushroom|fungi|chanterelle|enokitake|pleurotus/, "mushroom"],
    [/sweetcorn|maize|corn/, "corn-cob"],
    [/pumpkin|squash/, "squash"],
    [/bean|lentil|pulse|chickpea/, "bean-pod"],
    [/basil|mint|parsley|coriander|cilantro|dill|sage|thyme|rosemary|herb/, "herb-sprig"],
    [/cinnamon/, "cinnamon-sticks"],
    [/peppercorn|black-pepper|white-pepper/, "peppercorns"],
    [/clove/, "cloves"],
    [/spice|seasoning/, "spice-jar"],
    [/bread|roll|bun|bagel/, "bread-loaf"],
    [/wheat|barley|rye|oat/, "grain-ear"],
    [/rice/, "rice-bowl"],
    [/pasta|noodle/, "pasta-bowl"],
    [/cereal|muesli|granola/, "cereal-bowl"],
    [/flour/, "flour-bag"],
    [/milk|cream|yoghurt|yogurt/, "milk-bottle"],
    [/cheese|mozzarella/, "cheese-wedge"],
    [/egg/, "egg"],
    [/salmon|tuna|cod|haddock|mackerel|sardine|trout|fish/, "fish"],
    [/prawn|shrimp|lobster|crab|shellfish/, "shellfish"],
    [/chicken|poultry|turkey|duck/, "poultry"],
    [/beef|pork|lamb|meat/, "meat-cut"],
    [/kidney/, "organ-meat-pack"],
    [/liver/, "organ-meat-pack"],
    [/fat-tissue|animal-fats|butter/, "fat-pack"],
    [/almond|hazelnut|walnut|cashew|pistachio|pecan|macadamia|chestnut|brazil-nut|peanut|nuts?$/, "nuts"],
    [/seeds?|linseed|rapeseed/, "seeds"],
    [/honey/, "honey-jar"],
    [/tea/, "tea-cup"],
    [/coffee/, "coffee-cup"],
    [/juice|smoothie|drink|water|wine|beer/, "drink-glass"],
    [/baby|infant|formula/, "infant-jar"],
    [/oil/, "oil-bottle"],
    [/sauce|paste|spread|jam|preserve/, "labelled-jar"],
    [/cake|biscuit|cookie|snack|confection/, "snack-pack"],
  ];
  for (const [pattern, subject] of rules) if (pattern.test(id)) return subject;
  if (category === "Fruit") return "labelled-fruit-pack";
  if (category === "Vegetables") return "labelled-produce-pack";
  if (category === "Herbs & spices") return "labelled-spice-pouch";
  if (category === "Meat, fish & dairy") return "labelled-chilled-pack";
  if (category === "Grains & staples") return "labelled-staple-pack";
  if (category === "Baby food") return "infant-jar";
  return "labelled-food-pack";
}

function formFor(id, subject) {
  if (/oil-bottle|milk-bottle/.test(subject)) return "bottle";
  if (/juice|drink|smoothie|wine|beer|water|cider/.test(id)) return "drink";
  if (/frozen/.test(id)) return "frozen-pack";
  if (/canned|tinned/.test(id)) return "tin";
  if (/dried|powder|flour/.test(id)) return "dry-pack";
  if (/jar|paste|sauce|spread|honey/.test(subject + id)) return "jar";
  if (/pack|chocolate-bar|snack/.test(subject)) return "pack";
  if (/bowl|pasta|rice|cereal/.test(subject)) return "bowl";
  return "fresh";
}

function monogram(name) {
  const words = name.replaceAll(/[^a-zA-Z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  if (words.length > 1) return words.slice(0, 3).map((word) => word[0]).join("").toUpperCase();
  return (words[0] ?? "F").slice(0, 2).toUpperCase();
}

function buildProfile(food) {
  const seed = hash(food.canonicalId);
  const subject = subjectFor(food.canonicalId, food.category);
  return {
    id: food.canonicalId,
    name: food.name,
    subject,
    form: formFor(food.canonicalId, subject),
    accent: accents[seed % accents.length],
    detail: `${["stripe", "dots", "cut", "seeds", "window", "band"][(seed >>> 5) % 6]}-${seed.toString(36)}`,
    monogram: monogram(food.name),
  };
}

function treatment(profile) {
  if (profile.form === "frozen-pack") return `<g stroke="${palette.sky}" stroke-width="2"><path d="M75 65v20M66 70l18 10M84 70 66 80"/></g>`;
  if (profile.form === "tin") return `<g><rect x="68" y="65" width="19" height="22" rx="3" fill="${palette.cream}" stroke="${palette.forest}" stroke-width="2"/><path stroke="${palette.forest}" stroke-width="2" d="M70 70h15M70 82h15"/></g>`;
  if (profile.form === "dry-pack") return `<path fill="${palette.cream}" stroke="${palette.forest}" stroke-width="2" d="M66 65h22l-3 22H69Z"/>`;
  return "";
}

function produceShape(subject, colour, seed) {
  const tilt = seed % 11 - 5;
  const g = (body) => `<g transform="rotate(${tilt} 45 46)">${body}</g>`;
  if (subject.includes("bottle")) return g(`<path fill="${palette.cream}" stroke="${palette.forest}" stroke-width="3" d="M36 13h19v12c7 5 9 14 9 26v30H27V51c0-12 3-21 9-26Z"/><rect x="31" y="43" width="29" height="25" rx="5" fill="${colour}"/><path fill="${palette.leaf}" d="M49 38c8-12 18-11 23-3-7 6-15 7-23 3Z"/>`);
  if (subject.includes("pack") || subject.includes("pouch") || subject.includes("bar") || subject.includes("bag")) return g(`<path fill="${colour}" stroke="${palette.forest}" stroke-width="3" d="M18 20h55l5 61H13Z"/><rect x="23" y="33" width="45" height="28" rx="6" fill="${palette.cream}"/><path fill="none" stroke="${palette.forest}" stroke-width="2" d="M18 27h55M16 72h60"/>`);
  if (subject.includes("jar")) return g(`<path fill="${palette.cream}" stroke="${palette.forest}" stroke-width="3" d="M23 25h48v55c0 5-4 8-9 8H32c-5 0-9-3-9-8Z"/><path fill="${colour}" d="M26 45h42v29H26Z"/><path stroke="${palette.forest}" stroke-width="4" d="M22 25h50"/>`);
  if (subject.includes("cup") || subject.includes("glass")) return g(`<path fill="${palette.cream}" stroke="${palette.forest}" stroke-width="3" d="M24 20h45l-5 62H30Z"/><path fill="${colour}" d="M30 46h33l-3 31H33Z"/><path fill="none" stroke="${palette.forest}" stroke-width="3" d="M68 34h8c13 0 11 25-2 25h-8"/>`);
  if (subject.includes("bowl")) return g(`<path fill="${palette.cream}" stroke="${palette.forest}" stroke-width="3" d="M14 40h67c-3 29-14 44-34 44S18 69 14 40Z"/><path fill="${colour}" d="M20 43h55c-6 14-16 21-28 21s-21-7-27-21Z"/>`);
  if (/citrus-half|orange-half|lemon-half|lime-half|grapefruit-half|kiwi-half|avocado-half|pomegranate-half|coconut-half/.test(subject)) return g(`<circle cx="46" cy="49" r="32" fill="${colour}" stroke="${palette.forest}" stroke-width="3"/><circle cx="46" cy="49" r="23" fill="${palette.cream}" stroke="${palette.forest}" stroke-width="2"/><path stroke="${colour}" stroke-width="3" d="M46 27v44M24 49h44M30 33l32 32M62 33 30 65"/>`);
  if (subject === "grape-bunch" || subject === "berries" || subject === "cherries") return g(`<path fill="${palette.leaf}" d="M45 19c10-13 23-11 29-2-9 8-19 9-29 2Z"/><g fill="${colour}" stroke="${palette.forest}" stroke-width="2"><circle cx="31" cy="40" r="10"/><circle cx="47" cy="35" r="11"/><circle cx="62" cy="42" r="10"/><circle cx="39" cy="55" r="11"/><circle cx="56" cy="58" r="11"/><circle cx="47" cy="72" r="10"/></g>`);
  if (subject === "banana") return g(`<path fill="${palette.gold}" stroke="${palette.forest}" stroke-width="3" d="M16 24c13 37 37 51 67 35-11 26-43 31-62 11C7 56 6 39 16 24Z"/><path fill="${palette.cream}" d="M24 32c12 23 29 31 50 27-20 11-40-1-50-27Z"/>`);
  if (subject === "sweet-pepper") return g(`<path fill="${palette.leaf}" d="M43 26c2-15 11-20 25-16-8 8-13 14-14 22Z"/><path fill="${palette.coral}" stroke="${palette.forest}" stroke-width="3" d="M48 25c22-6 35 11 31 34-4 21-15 31-31 31S21 80 17 59c-4-23 9-40 31-34Z"/><path fill="none" stroke="${palette.cream}" stroke-width="3" d="M48 34v44"/>`);
  if (subject === "tomato") return g(`<circle cx="48" cy="55" r="32" fill="${palette.coral}" stroke="${palette.forest}" stroke-width="3"/><path fill="${palette.leaf}" d="m48 29-9-13 3 16-16-6 12 12-17 2 19 7 8-18 9 17 18-7-17 1 13-13-17 6 3-17Z"/>`);
  if (/apple|pear|mango|papaya|stone-fruit|fig-half/.test(subject)) return g(`<path fill="${colour}" stroke="${palette.forest}" stroke-width="3" d="M18 53c4-24 22-33 38-22 17-10 33 0 36 24 2 25-17 38-38 38S14 78 18 53Z"/><path fill="${palette.leaf}" d="M48 27c5-14 17-20 31-15-6 12-17 18-31 15Z"/><path fill="none" stroke="${palette.cream}" stroke-width="3" d="M31 54c7-10 16-14 28-16"/>`);
  if (subject === "strawberry") return g(`<path fill="${palette.coral}" stroke="${palette.forest}" stroke-width="3" d="M18 36c8-13 21-14 30-5 9-9 22-8 30 5-1 24-15 42-30 54-15-12-29-30-30-54Z"/><path fill="${palette.leaf}" d="m48 34-10-18 11 7 10-7-5 18Z"/><g fill="${palette.cream}"><circle cx="35" cy="48" r="2"/><circle cx="55" cy="48" r="2"/><circle cx="45" cy="63" r="2"/><circle cx="59" cy="66" r="2"/></g>`);
  if (/raspberry|blueberry/.test(subject)) return g(`<g fill="${colour}" stroke="${palette.forest}" stroke-width="2"><circle cx="33" cy="37" r="11"/><circle cx="51" cy="32" r="11"/><circle cx="66" cy="43" r="11"/><circle cx="39" cy="54" r="11"/><circle cx="57" cy="59" r="12"/><circle cx="48" cy="74" r="11"/></g><path fill="${palette.leaf}" d="M46 25c7-14 19-18 31-10-8 10-18 14-31 10Z"/>`);
  if (subject === "melon-slice") return g(`<path fill="${colour}" stroke="${palette.forest}" stroke-width="3" d="M15 64c16-35 50-48 72-19-12 29-42 43-72 19Z"/><path fill="${palette.cream}" d="M23 62c15-26 40-35 57-17-13 20-35 29-57 17Z"/><g fill="${palette.forest}"><ellipse cx="45" cy="53" rx="2" ry="5"/><ellipse cx="59" cy="49" rx="2" ry="5"/></g>`);
  if (/cucumber|courgette|aubergine|chilli|carrot|parsnip/.test(subject)) return g(`<path fill="${colour}" stroke="${palette.forest}" stroke-width="3" d="M22 72c8-33 22-51 51-52 3 27-12 53-40 64-9 4-14-3-11-12Z"/><path fill="${palette.leaf}" d="M67 25c4-13 14-18 24-13-4 11-12 17-24 13Z"/><path fill="none" stroke="${palette.cream}" stroke-width="2" d="M31 67c10-17 22-28 36-34"/>`);
  if (subject === "pea-pod" || subject === "bean-pod") return g(`<path fill="${palette.leaf}" stroke="${palette.forest}" stroke-width="3" d="M14 58c17-30 44-37 70-25-13 31-42 45-70 25Z"/><g fill="${palette.mint}" stroke="${palette.forest}" stroke-width="2"><circle cx="33" cy="54" r="7"/><circle cx="49" cy="49" r="7"/><circle cx="65" cy="43" r="7"/></g>`);
  if (/broccoli|cauliflower/.test(subject)) return g(`<path fill="${palette.leaf}" stroke="${palette.forest}" stroke-width="3" d="M39 56h16l9 33H31Z"/><g fill="${colour}" stroke="${palette.forest}" stroke-width="3"><circle cx="29" cy="43" r="16"/><circle cx="47" cy="31" r="18"/><circle cx="67" cy="43" r="16"/><circle cx="48" cy="51" r="18"/></g>`);
  if (/round-cabbage|brussels-sprouts/.test(subject)) return g(`<g fill="${colour}" stroke="${palette.forest}" stroke-width="3"><circle cx="48" cy="51" r="32"/><path fill="none" d="M22 47c14-16 37-19 53-4M26 64c15-11 34-11 47 0M48 20c-9 18-9 43 0 63"/></g>`);
  if (/chinese-cabbage|lettuce|leafy-greens|spinach|herb-sprig/.test(subject)) return g(`<path fill="${colour}" stroke="${palette.forest}" stroke-width="3" d="M16 71C13 35 37 14 80 17c-3 41-26 61-64 54Z"/><path fill="none" stroke="${palette.cream}" stroke-width="3" d="M21 65c20-12 35-26 51-42M38 50c-2-10-7-16-14-21M52 39c9 0 17-3 23-8"/>`);
  if (/onion|garlic|beetroot|radish|turnip|potato|sweet-potato|ginger-root|turmeric-root/.test(subject)) return g(`<path fill="${colour}" stroke="${palette.forest}" stroke-width="3" d="M47 24c17 7 26 20 21 38-4 18-17 27-21 27s-17-9-21-27c-5-18 4-31 21-38Z"/><path fill="${palette.leaf}" d="M46 27C30 18 27 9 31 3c13 4 18 12 15 24Zm3 0C64 16 74 17 80 23c-10 9-21 10-31 4Z"/><path stroke="${palette.cream}" stroke-width="2" d="M47 38v38"/>`);
  if (/grain-ear|corn-cob|asparagus|celery|leek|spring-onions|cinnamon-sticks/.test(subject)) return g(`<path stroke="${palette.forest}" stroke-width="4" d="M47 12v72"/><g fill="${colour}" stroke="${palette.forest}" stroke-width="2"><path d="M44 31C28 29 24 20 26 11c13 1 20 8 18 20Z"/><path d="M50 43c16-2 20-11 18-20-13 1-20 8-18 20Z"/><path d="M44 56c-16-2-20-11-18-20 13 1 20 8 18 20Z"/><path d="M50 69c16-2 20-11 18-20-13 1-20 8-18 20Z"/></g>`);
  if (/fish/.test(subject)) return g(`<path fill="${colour}" stroke="${palette.forest}" stroke-width="3" d="M15 50c15-21 40-22 58-3-16 22-44 22-58 3Z"/><path fill="${palette.leaf}" stroke="${palette.forest}" stroke-width="3" d="M69 46 86 31v31Z"/><circle fill="${palette.forest}" cx="33" cy="44" r="3"/>`);
  if (/shellfish/.test(subject)) return g(`<path fill="${colour}" stroke="${palette.forest}" stroke-width="3" d="M19 59c4-31 36-45 59-25-4 31-35 49-59 25Z"/><path fill="none" stroke="${palette.cream}" stroke-width="3" d="M33 67c5-19 17-30 35-34M42 63l-9-12M52 55l-7-14M62 46l-5-12"/>`);
  if (subject === "egg") return g(`<path fill="${palette.cream}" stroke="${palette.forest}" stroke-width="3" d="M47 14c15 0 29 33 27 50-2 17-13 25-27 25S22 81 20 64c-2-17 12-50 27-50Z"/><circle fill="${palette.gold}" cx="47" cy="59" r="13"/>`);
  if (/meat-cut|poultry/.test(subject)) return g(`<path fill="${colour}" stroke="${palette.forest}" stroke-width="3" d="M16 57c0-23 20-39 42-32 18 6 21 25 7 40-13 15-49 13-49-8Z"/><ellipse fill="${palette.cream}" cx="53" cy="44" rx="11" ry="9"/><circle fill="${palette.gold}" cx="53" cy="44" r="5"/>`);
  if (subject === "cheese-wedge") return g(`<path fill="${palette.gold}" stroke="${palette.forest}" stroke-width="3" d="m15 71 61-48 8 58H15Z"/><g fill="${palette.cream}" stroke="${palette.forest}" stroke-width="2"><circle cx="43" cy="65" r="6"/><circle cx="66" cy="55" r="5"/><circle cx="71" cy="72" r="4"/></g>`);
  if (subject === "bread-loaf") return g(`<path fill="${palette.gold}" stroke="${palette.forest}" stroke-width="3" d="M17 48c0-22 15-34 31-34s31 12 31 34v33H17Z"/><path fill="none" stroke="${palette.cream}" stroke-width="4" d="M31 29 25 44M49 25 43 42M67 31 60 46"/>`);
  if (subject === "squash") return g(`<path fill="${palette.gold}" stroke="${palette.forest}" stroke-width="3" d="M16 57c0-24 14-38 32-38s32 14 32 38-14 34-32 34-32-10-32-34Z"/><path fill="none" stroke="${palette.cream}" stroke-width="3" d="M32 25c-8 20-8 42 0 59M48 21v67M64 25c8 20 8 42 0 59"/><path fill="${palette.leaf}" d="M45 22c-1-12 7-20 18-20-1 13-7 20-18 20Z"/>`);
  if (subject === "pineapple") return g(`<path fill="${palette.gold}" stroke="${palette.forest}" stroke-width="3" d="M27 36h40l8 45H19Z"/><path fill="${palette.leaf}" d="M47 37 31 12l15 8L53 5l5 17 16-8-13 24Z"/><path stroke="${palette.forest}" stroke-width="2" d="m24 49 45 21M69 49 24 70"/>`);
  if (subject === "mushroom") return g(`<path fill="${palette.cream}" stroke="${palette.forest}" stroke-width="3" d="M39 49h17l7 38H32Z"/><path fill="${colour}" stroke="${palette.forest}" stroke-width="3" d="M14 50c2-25 16-38 34-38s32 13 34 38Z"/>`);
  if (/peppercorns|cloves|dates/.test(subject)) return g(`<g fill="${colour}" stroke="${palette.forest}" stroke-width="2"><circle cx="28" cy="35" r="10"/><circle cx="50" cy="28" r="11"/><circle cx="68" cy="42" r="10"/><circle cx="34" cy="59" r="11"/><circle cx="58" cy="65" r="12"/></g>`);
  if (/nuts|seeds/.test(subject)) return g(`<g fill="${colour}" stroke="${palette.forest}" stroke-width="2"><ellipse cx="29" cy="38" rx="9" ry="13"/><ellipse cx="49" cy="31" rx="10" ry="14"/><ellipse cx="67" cy="44" rx="9" ry="13"/><ellipse cx="38" cy="61" rx="10" ry="14"/><ellipse cx="59" cy="66" rx="10" ry="14"/></g>`);
  return g(`<path fill="${palette.leaf}" d="M48 25c5-15 17-21 32-16-6 13-17 19-32 16Z"/><path fill="${colour}" stroke="${palette.forest}" stroke-width="3" d="M17 53c4-24 23-33 39-22 17-10 34 0 36 24 2 25-17 39-38 39S12 79 17 53Z"/><path fill="none" stroke="${palette.cream}" stroke-width="3" d="M30 54c7-10 17-15 29-16"/>`);
}

function renderSvg(profile) {
  const seed = hash(profile.id);
  const colour = palette[profile.accent];
  const renderedSubject = profile.form === "drink" ? "drink-glass" : profile.subject;
  const art = produceShape(renderedSubject, colour, seed);
  const badge = `<g><rect x="67" y="67" width="23" height="20" rx="7" fill="${palette.forest}"/><text x="78.5" y="81" fill="${palette.cream}" font-family="Arial,sans-serif" font-size="9" font-weight="700" text-anchor="middle">${profile.monogram}</text></g>`;
  const detailKind = profile.detail.split("-")[0];
  const details = {
    stripe: `<path d="M8 14h18" stroke="${colour}" stroke-width="4" stroke-linecap="round"/>`,
    dots: `<g fill="${colour}"><circle cx="11" cy="12" r="3"/><circle cx="21" cy="12" r="2"/><circle cx="16" cy="20" r="2"/></g>`,
    cut: `<path d="m8 20 9-12 9 12" fill="none" stroke="${colour}" stroke-width="3"/>`,
    seeds: `<g fill="${colour}"><ellipse cx="12" cy="14" rx="2" ry="5"/><ellipse cx="21" cy="14" rx="2" ry="5"/></g>`,
    window: `<rect x="8" y="8" width="18" height="14" rx="5" fill="none" stroke="${colour}" stroke-width="3"/>`,
    band: `<path d="M8 9h20M8 18h13" stroke="${colour}" stroke-width="3" stroke-linecap="round"/>`,
  }[detailKind];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" data-subject="${profile.subject}" data-rendered-subject="${renderedSubject}"><title>${escapeXml(profile.name)} illustration</title><rect width="96" height="96" rx="22" fill="${palette.cream}"/>${art}${treatment(profile)}${badge}${details}</svg>\n`;
}

await mkdir(OUTPUT, { recursive: true });
await mkdir(ARTIFACT_OUTPUT, { recursive: true });
for (const file of await readdir(OUTPUT).catch(() => [])) if (file.endsWith(".svg")) await rm(new URL(file, OUTPUT));
const foods = new Map();
for (const food of dataset.foods) if (!foods.has(food.canonicalId)) foods.set(food.canonicalId, food);
const profiles = [...foods.values()].sort((a, b) => a.canonicalId.localeCompare(b.canonicalId)).map(buildProfile);
await writeFile(PROFILE_OUTPUT, `${JSON.stringify(profiles, null, 2)}\n`, "utf8");
for (const profile of profiles) await writeFile(new URL(`${profile.id}.svg`, OUTPUT), renderSvg(profile), "utf8");

const cards = profiles.map((profile) => `<article><img src="../public/food-art/${profile.id}.svg" width="96" height="96" alt=""><img src="../public/food-art/${profile.id}.svg" width="48" height="48" alt=""><div><strong>${escapeXml(profile.name)}</strong><small>${profile.id}<br>${profile.subject} · ${profile.form}</small></div></article>`).join("");
const contactSheet = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Residue Lens food artwork review</title><style>body{margin:24px;font-family:Arial,sans-serif;background:#f5f1e6;color:#17352c}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}article{display:grid;grid-template-columns:96px 48px 1fr;gap:9px;align-items:center;padding:10px;background:white;border:1px solid #ccd5cf;border-radius:10px}strong,small{display:block}small{margin-top:5px;color:#5b6b65;font-size:11px}</style><h1>Food artwork review (${profiles.length})</h1><p>Each card shows the 96px and 48px rendering plus the semantic profile.</p><main>${cards}</main></html>`;
await writeFile(new URL("food-art-contact-sheet.html", ARTIFACT_OUTPUT), contactSheet, "utf8");
console.log(`Generated ${profiles.length} semantic profiles and food SVGs.`);
