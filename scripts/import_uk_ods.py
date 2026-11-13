"""Build the checked-in UK pesticide-residue catalogue from official ODS files."""

from __future__ import annotations

import json
import re
import statistics
import urllib.request
import zipfile
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from tempfile import TemporaryDirectory
from xml.etree import ElementTree


@dataclass(frozen=True)
class Source:
    key: str
    year: int
    period: str
    url: str
    default_region: str = "GB"


BASE = "https://s3.eu-west-1.amazonaws.com/data.defra.gov.uk/PRIF/"
SOURCES = (
    Source("2016-gb", 2016, "Annual", BASE + "2016_annual_data.ods"),
    Source("2017-gb", 2017, "Annual", BASE + "2017_annual_data.ods"),
    Source("2018-gb", 2018, "Annual", BASE + "2018_annual_data_v2.ods"),
    Source("2019-gb", 2019, "Annual", BASE + "2019_annual_data.ods"),
    Source("2020-gb", 2020, "Annual", BASE + "2020_prif_Annual.ods"),
    Source("2021-gb", 2021, "Annual", BASE + "2021_annual_data.ods"),
    Source("2022-gb", 2022, "Annual", BASE + "2022_PRiF_Annual_Data.ods"),
    Source("2023-gb", 2023, "Annual", BASE + "2023+GB+ODS.ods"),
    Source("2023-ni", 2023, "Annual", BASE + "2023+NI+ODS.ods", "NI"),
    Source("2024-gb", 2024, "Annual", BASE + "2024+GB+ODS.ods"),
    Source("2024-ni", 2024, "Annual", BASE + "2024+NI+ODS.ods", "NI"),
    Source("2025-q1", 2025, "Q1", BASE + "Q1_2025_quarterly_data.ods"),
    Source("2025-q2", 2025, "Q2", BASE + "Q2_2025_quarterly_data.ods"),
    Source("2025-q3", 2025, "Q3", BASE + "Q3_2025_quarterly_data.ods"),
    Source("2025-q4", 2025, "Q4", BASE + "Q4+ODS+Data+Table+2025.ods"),
    Source("2026-q1", 2026, "Q1", BASE + "Q1+2026+ODS+Data+updated.ods"),
)
SOURCE_PAGE = "https://www.data.gov.uk/dataset/5d5028ef-9918-4ab7-8755-81f3ad06f308/pesticide-residues-in-food"
OUTPUT_DIRECTORY = Path(__file__).parents[1] / "src" / "data"
TABLE_NS = "urn:oasis:names:tc:opendocument:xmlns:table:1.0"
NS = {"table": TABLE_NS}
SAMPLE_ID_RE = re.compile(r"^\d{4}/\d{4}")
RESULT_RE = re.compile(r"^(.*?)\s+([<>]?\d+(?:\s*\.\s*\d+)?)\s+\((.+)\)\s*!?\s*$", re.I)
NUMERIC_MRL_RE = re.compile(r"MRL\s*=\s*([<>]?\d+(?:\.\d+)?)", re.I)
MISSING_MRL_RE = re.compile(r"(?:No\s+MRL|MRL\s+N/?A)", re.I)


CATALOGUE_ROWS = [
    ("animal fats", "animal-fats", "Animal fats", "Meat, fish & dairy"),
    ("apple|apples", "apples", "Apples", "Fruit"), ("apple juice|applejuice", "apple-juice", "Apple juice", "Drinks & processed"),
    ("apricots", "apricots", "Apricots", "Fruit"), ("asparagus", "asparagus", "Asparagus", "Vegetables"),
    ("aubergine|aubergines", "aubergines", "Aubergines", "Vegetables"), ("avocado", "avocados", "Avocados", "Fruit"),
    ("banana", "bananas", "Bananas", "Fruit"), ("barley", "barley", "Barley", "Grains & staples"),
    ("beef", "beef", "Beef", "Meat, fish & dairy"), ("beer", "beer", "Beer", "Drinks & processed"),
    ("beetroot", "beetroot", "Beetroot", "Vegetables"), ("beans|beans with pods|beanswithpods", "green-beans", "Green beans", "Vegetables"),
    ("beans dried", "dried-beans", "Dried beans", "Grains & staples"), ("beans tinned", "tinned-beans", "Tinned beans", "Drinks & processed"),
    ("berries", "mixed-berries", "Mixed berries", "Fruit"), ("bread|bread ord", "bread", "Bread", "Grains & staples"),
    ("bread gf|breadgf", "gluten-free-bread", "Gluten-free bread", "Grains & staples"), ("breadord", "bread", "Bread", "Grains & staples"), ("breakfast cereal", "breakfast-cereal", "Breakfast cereal", "Grains & staples"),
    ("broccoli", "broccoli", "Broccoli", "Vegetables"), ("brussel sprouts|brusselsprouts", "brussels-sprouts", "Brussels sprouts", "Vegetables"),
    ("cabbage", "cabbage", "Cabbage", "Vegetables"), ("carrot|carrots", "carrots", "Carrots", "Vegetables"),
    ("cashew nuts", "cashew-nuts", "Cashew nuts", "Grains & staples"), ("cauliflower", "cauliflower", "Cauliflower", "Vegetables"),
    ("celery", "celery", "Celery", "Vegetables"), ("cheese", "cheese", "Cheese", "Meat, fish & dairy"),
    ("cheese buffalo ewes goats", "speciality-cheese", "Buffalo, ewe and goat cheese", "Meat, fish & dairy"),
    ("cheese hard", "hard-cheese", "Hard cheese", "Meat, fish & dairy"), ("cheese processed", "processed-cheese", "Processed cheese", "Meat, fish & dairy"),
    ("cheese soft", "soft-cheese", "Soft cheese", "Meat, fish & dairy"), ("cherries|cherry", "cherries", "Cherries", "Fruit"),
    ("chillies|chillipepper", "chilli-peppers", "Chilli peppers", "Vegetables"), ("chinese cabbage", "chinese-cabbage", "Chinese cabbage", "Vegetables"),
    ("chocolate", "chocolate", "Chocolate", "Drinks & processed"), ("cooked meat", "cooked-meat", "Cooked meat", "Meat, fish & dairy"),
    ("courgette|courgettes", "courgettes", "Courgettes", "Vegetables"), ("cream", "cream", "Cream", "Meat, fish & dairy"),
    ("crisps potato based", "potato-crisps", "Potato crisps", "Drinks & processed"), ("cucumber", "cucumbers", "Cucumbers", "Vegetables"),
    ("curry leaves", "curry-leaves", "Curry leaves", "Herbs & spices"), ("dried fruits grapes", "raisins", "Raisins and dried grapes", "Fruit"),
    ("edible seeds", "edible-seeds", "Edible seeds", "Grains & staples"), ("eggs", "eggs", "Eggs", "Meat, fish & dairy"),
    ("figs", "figs", "Figs", "Fruit"), ("fish oily", "oily-fish", "Oily fish", "Meat, fish & dairy"),
    ("fish predator", "predatory-fish", "Predatory fish", "Meat, fish & dairy"), ("fish sea", "sea-fish", "Sea fish", "Meat, fish & dairy"),
    ("fish tinned", "tinned-fish", "Tinned fish", "Meat, fish & dairy"), ("fish white", "white-fish", "White fish", "Meat, fish & dairy"),
    ("frozen fruits", "frozen-fruit", "Frozen fruit", "Fruit"), ("frozen vegetables", "frozen-vegetables", "Frozen vegetables", "Vegetables"),
    ("game", "game", "Game", "Meat, fish & dairy"), ("garlic", "garlic", "Garlic", "Vegetables"),
    ("ginger", "ginger", "Ginger", "Herbs & spices"), ("gluten free food", "gluten-free-food", "Gluten-free food", "Grains & staples"),
    ("grapefruit", "grapefruit", "Grapefruit", "Fruit"), ("grapes", "grapes", "Grapes", "Fruit"),
    ("herbs", "fresh-herbs", "Fresh herbs", "Herbs & spices"), ("honey", "honey", "Honey", "Drinks & processed"),
    ("infant food|infantfood|infantfood f v", "infant-food", "Infant food", "Baby food"), ("infant formula|infantformula", "infant-formula", "Infant formula", "Baby food"),
    ("jam", "jam", "Jam", "Drinks & processed"), ("kiwi|kiwi fruit|kiwifruit", "kiwi-fruit", "Kiwi fruit", "Fruit"),
    ("lamb", "lamb", "Lamb", "Meat, fish & dairy"), ("leeks", "leeks", "Leeks", "Vegetables"),
    ("lemon limes", "lemons-limes", "Lemons and limes", "Fruit"), ("lemons", "lemons", "Lemons", "Fruit"),
    ("lentils", "lentils", "Lentils", "Grains & staples"), ("lettuce", "lettuce", "Lettuce", "Vegetables"),
    ("limes", "limes", "Limes", "Fruit"), ("liver bovine", "bovine-liver", "Bovine liver", "Meat, fish & dairy"),
    ("mango", "mangoes", "Mangoes", "Fruit"), ("mango juice", "mango-juice", "Mango juice", "Drinks & processed"),
    ("melon", "melons", "Melons", "Fruit"), ("milk", "milk", "Milk", "Meat, fish & dairy"),
    ("mushroom|mushrooms", "mushrooms", "Mushrooms", "Vegetables"), ("mushrooms speciality", "speciality-mushrooms", "Speciality mushrooms", "Vegetables"),
    ("non dairy milk", "non-dairy-milk", "Non-dairy milk", "Drinks & processed"), ("nuts", "nuts", "Nuts", "Grains & staples"),
    ("oats", "oats", "Oats", "Grains & staples"), ("okra", "okra", "Okra", "Vegetables"),
    ("olive oil", "olive-oil", "Olive oil", "Drinks & processed"), ("onion|onions", "onions", "Onions", "Vegetables"),
    ("orange juice|orangejuice", "orange-juice", "Orange juice", "Drinks & processed"), ("oranges", "oranges", "Oranges", "Fruit"),
    ("parsnip|parsnips", "parsnips", "Parsnips", "Vegetables"), ("pasta", "pasta", "Pasta", "Grains & staples"),
    ("peach nect|peach nectarine|peach nectarines|peach and nectarine|peaches nectarines|peachesnectarines", "peaches-nectarines", "Peaches and nectarines", "Fruit"),
    ("pears", "pears", "Pears", "Fruit"), ("peas edible pods|peas with edible pods", "mangetout-sugar-snap-peas", "Mangetout and sugar snap peas", "Vegetables"),
    ("peas without edible pods|peas without pods", "garden-peas", "Garden peas", "Vegetables"), ("peppers|peppers sweet", "sweet-peppers", "Sweet peppers", "Vegetables"),
    ("pineapple|pineapples", "pineapples", "Pineapples", "Fruit"), ("plant based chocolate", "plant-based-chocolate", "Plant-based chocolate", "Drinks & processed"),
    ("plant based protein|plantprotein", "plant-based-protein", "Plant-based protein", "Drinks & processed"), ("plum|plums", "plums", "Plums", "Fruit"),
    ("popcorn", "popcorn", "Popcorn", "Grains & staples"), ("pork", "pork", "Pork", "Meat, fish & dairy"),
    ("pork proc", "processed-pork", "Processed pork", "Meat, fish & dairy"), ("potato|potatoes", "potatoes", "Potatoes", "Vegetables"),
    ("potato proc", "processed-potatoes", "Processed potato products", "Drinks & processed"), ("poultry meat|poultrymeat", "poultry", "Poultry", "Meat, fish & dairy"),
    ("poultry proc", "processed-poultry", "Processed poultry", "Meat, fish & dairy"), ("pre packed salad|prepack salad|prepacked salad", "prepared-salad", "Prepared salad", "Vegetables"),
    ("prepared fruit|preparedfruit|prepfruit", "prepared-fruit", "Prepared fruit", "Fruit"), ("processed peppers", "processed-peppers", "Processed peppers", "Drinks & processed"),
    ("pulses", "pulses", "Pulses", "Grains & staples"), ("pumpkin and squash", "pumpkin-squash", "Pumpkin and squash", "Vegetables"),
    ("raspberry", "raspberries", "Raspberries", "Fruit"), ("rice", "rice", "Rice", "Grains & staples"),
    ("rye|rye grain|ryegrain", "rye", "Rye", "Grains & staples"), ("rye flour|ryeflour", "rye-flour", "Rye flour", "Grains & staples"),
    ("salad leaves", "salad-leaves", "Salad leaves", "Vegetables"), ("shellfish", "shellfish", "Shellfish", "Meat, fish & dairy"),
    ("snacks cereal based", "cereal-snacks", "Cereal-based snacks", "Drinks & processed"), ("snacks speciality", "speciality-snacks", "Speciality snacks", "Drinks & processed"),
    ("soft citrus", "soft-citrus", "Soft citrus", "Fruit"), ("soya based drink|soya milk", "soya-drinks", "Soya drinks", "Drinks & processed"),
    ("soya prod|soyaprod", "soya-products", "Soya products", "Drinks & processed"), ("soya milk|soyamilk", "soya-drinks", "Soya drinks", "Drinks & processed"), ("spec beans dried|specbeans dried", "speciality-dried-beans", "Speciality dried beans", "Grains & staples"),
    ("spec fruit|specfruit|speciality fruit|specialityfruit", "speciality-fruit", "Speciality fruit", "Fruit"), ("speciality vegetables|specialityveg", "speciality-vegetables", "Speciality vegetables", "Vegetables"),
    ("spices", "spices", "Spices", "Herbs & spices"), ("spices turmeric", "turmeric", "Turmeric", "Herbs & spices"),
    ("spinach", "spinach", "Spinach", "Vegetables"), ("spr greens kale|sprgreens kale", "spring-greens-kale", "Spring greens and kale", "Vegetables"),
    ("spring greens", "spring-greens", "Spring greens", "Vegetables"), ("spring onions|springonions", "spring-onions", "Spring onions", "Vegetables"),
    ("strawberries|strawberry", "strawberries", "Strawberries", "Fruit"), ("sundriedtomatoes", "sun-dried-tomatoes", "Sun-dried tomatoes", "Drinks & processed"),
    ("sweet potatoes|sweetpotatoes", "sweet-potatoes", "Sweet potatoes", "Vegetables"), ("tin tomatoes|tintomatoes", "tinned-tomatoes", "Tinned tomatoes", "Drinks & processed"),
    ("tomatoes", "tomatoes", "Tomatoes", "Fruit"), ("tomatoes processed|tomatoesprocessed", "processed-tomatoes", "Processed tomatoes", "Drinks & processed"),
    ("vine leaves", "vine-leaves", "Vine leaves", "Vegetables"), ("oliveoil", "olive-oil", "Olive oil", "Drinks & processed"), ("saladleaves", "salad-leaves", "Salad leaves", "Vegetables"),
    ("driedfruits grapes", "raisins", "Raisins and dried grapes", "Fruit"), ("mangojuice", "mango-juice", "Mango juice", "Drinks & processed"), ("wheat", "wheat", "Wheat", "Grains & staples"),
    ("wheatflour", "wheat-flour", "Wheat flour", "Grains & staples"), ("wine", "wine", "Wine", "Drinks & processed"),
    ("yogurt", "yoghurt", "Yoghurt", "Meat, fish & dairy"),
]
COMMODITIES = {alias: (slug, name, category) for aliases, slug, name, category in CATALOGUE_ROWS for alias in aliases.split("|")}


def row_values(row: ElementTree.Element) -> list[str]:
    values: list[str] = []
    repeat_key = f"{{{TABLE_NS}}}number-columns-repeated"
    for cell in list(row):
        if cell.tag.endswith(("table-cell", "covered-table-cell")):
            text = " ".join("".join(cell.itertext()).split())
            values.extend([text] * min(int(cell.attrib.get(repeat_key, "1")), 20))
    while values and not values[-1]: values.pop()
    return values


def parse_result(text: str) -> dict[str, float | str | None] | None:
    match = RESULT_RE.match(text)
    if not match: return None
    name, concentration, limit_text = match.groups()
    mrl_match = NUMERIC_MRL_RE.search(limit_text)
    if mrl_match:
        mrl = float(mrl_match.group(1).lstrip("<>"))
    elif MISSING_MRL_RE.search(limit_text):
        mrl = None
    else:
        return None
    return {"name": name.strip(), "concentration": float(concentration.replace(" ", "").lstrip("<>")), "mrl": mrl}


def parse_sheet(sheet: ElementTree.Element) -> list[dict]:
    samples: list[dict] = []
    current = None
    for row in sheet.findall("table:table-row", NS):
        values = row_values(row)
        sample_id = values[0] if values else ""
        if SAMPLE_ID_RE.match(sample_id):
            if current: samples.append(current)
            current = {"id": sample_id, "organic": "organic" in sample_id.lower(), "residues": []}
        result_text = values[8] if len(values) > 8 else ""
        if current and result_text and "none were detected" not in result_text.lower():
            parsed = parse_result(result_text)
            if not parsed:
                raise ValueError(f"Unrecognised quantified residue result: {result_text!r}")
            current["residues"].append(parsed)
    if current: samples.append(current)
    return samples


def normalise_commodity(value: str) -> str:
    return " ".join(re.sub(r"[^a-z0-9]+", " ", value.lower()).split())


def sheet_identity(sheet_name: str, default_region: str = "GB") -> tuple[tuple[str, str, str], str] | None:
    if not re.search(r"_BNA_?$", sheet_name, re.I): return None
    region = "NI" if re.search(r"(?:\(NI?\)|_NI)(?:_|$)", sheet_name, re.I) else default_region
    key = normalise_commodity(re.sub(r"_BNA_?$", "", sheet_name, flags=re.I))
    previous = None
    while key != previous:
        previous = key
        key = re.sub(r"\s+(?:gb|ni|n|q1|q2 q4|part [12]|eu|[12])$", "", key)
    return (COMMODITIES[key], region) if key in COMMODITIES else None


def commodity_from_sheet(sheet_name: str) -> tuple[str, str, str] | None:
    resolved = sheet_identity(sheet_name)
    return resolved[0] if resolved else None


def rate(count: int, total: int) -> float:
    return round(count / total * 100, 1) if total else 0


def percentile(values: list[float], fraction: float) -> float:
    if not values: return 0
    ordered = sorted(values)
    return ordered[round((len(ordered) - 1) * fraction)]


def aggregate(identity: tuple[str, str, str], samples: list[dict], year: int, source_url: str, region: str, period: str) -> dict:
    slug, name, category = identity
    conventional = [sample for sample in samples if not sample["organic"]]
    organic = [sample for sample in samples if sample["organic"]]
    def metrics(rows: list[dict]) -> dict:
        counts = [len(row["residues"]) for row in rows]
        return {"samples": len(rows), "detectedPct": rate(sum(bool(r["residues"]) for r in rows), len(rows)), "residueFreePct": rate(sum(not r["residues"] for r in rows), len(rows)), "multiplePct": rate(sum(len(r["residues"]) >= 2 for r in rows), len(rows)), "aboveMrlPct": rate(sum(any(x["mrl"] is not None and x["concentration"] > x["mrl"] for x in r["residues"]) for r in rows), len(rows)), "medianResidues": round(statistics.median(counts), 1) if counts else 0, "maxResidues": max(counts, default=0)}
    residues = [result for sample in samples for result in sample["residues"]]
    frequencies = Counter(result["name"] for result in residues)
    details = []
    for residue_name, count in frequencies.most_common(12):
        matches = [r for r in residues if r["name"] == residue_name]
        concentrations = sorted(float(r["concentration"]) for r in matches)
        mrls = [float(r["mrl"]) for r in matches if r["mrl"] is not None]
        details.append({"name": residue_name, "detections": count, "samplePct": rate(count, len(samples)), "medianMgKg": round(statistics.median(concentrations), 3), "highMgKg": round(concentrations[round((len(concentrations)-1)*.95)], 3), "typicalMrlMgKg": round(statistics.median(mrls), 3) if mrls else None})
    return {"id": slug if region == "GB" else f"ni-{slug}", "canonicalId": slug, "name": name, "category": category, "region": region, "market": "United Kingdom", "programmeId": "uk-prif", "programme": "UK Pesticide Residues in Food monitoring", "year": year, "period": period, "sourceUrl": source_url, "all": metrics(samples), "conventional": metrics(conventional), "organic": metrics(organic), "topResidues": details}


def workbook_groups(path: Path, source: Source) -> dict:
    with zipfile.ZipFile(path) as archive: root = ElementTree.fromstring(archive.read("content.xml"))
    groups = {}
    name_key = f"{{{TABLE_NS}}}name"
    for sheet in root.findall(".//table:table", NS):
        resolved = sheet_identity(sheet.attrib.get(name_key, ""), source.default_region)
        if resolved:
            identity, region = resolved
            groups.setdefault((region, identity[0]), (identity, []))[1].extend(parse_sheet(sheet))
    return groups


def deduplicate(samples: list[dict]) -> list[dict]:
    unique = {}
    for sample in samples:
        if sample["id"] not in unique: unique[sample["id"]] = sample
        else:
            known = {(r["name"], r["concentration"], r["mrl"]) for r in unique[sample["id"]]["residues"]}
            unique[sample["id"]]["residues"].extend(r for r in sample["residues"] if (r["name"], r["concentration"], r["mrl"]) not in known)
    return list(unique.values())


def build_year(year: int, source_groups: list[tuple[Source, dict]]) -> dict:
    combined = {}
    for source, groups in source_groups:
        for key, (identity, samples) in groups.items():
            entry = combined.setdefault(key, {"identity": identity, "samples": [], "urls": [], "periods": []})
            entry["samples"].extend(samples)
            if source.url not in entry["urls"]: entry["urls"].append(source.url)
            if source.period not in entry["periods"]: entry["periods"].append(source.period)
    foods = []
    for (region, _), entry in combined.items():
        if "Annual" in entry["periods"]:
            period = "Annual"
        elif len(entry["periods"]) == 1:
            period = f"Quarterly {entry['periods'][0]}"
        else:
            period = f"Quarterly {entry['periods'][0]}–{entry['periods'][-1]}"
        foods.append(aggregate(entry["identity"], deduplicate(entry["samples"]), year, entry["urls"][-1], region, period))
    foods.sort(key=lambda f: (f.get("region", "GB"), f["category"], f["name"]))
    return {"meta": {"title": f"Pesticide residues in food: {year}", "year": year, "region": "Great Britain and Northern Ireland", "sourceUrl": SOURCE_PAGE, "sourcePage": SOURCE_PAGE, "licence": "UK Open Government Licence v3.0", "generatedNote": "BNA sample sheets are normalised; split and quarterly releases are deduplicated by sample identifier."}, "foods": foods}


def combine_latest(datasets: list[dict]) -> dict:
    versions = {}
    for dataset in datasets:
        for food in dataset["foods"]: versions.setdefault(food["id"], []).append(food)
    foods = []
    for records in versions.values():
        ordered = sorted(records, key=lambda f: f["year"], reverse=True)
        latest = dict(ordered[0])
        latest["history"] = [{key: record.get(key, "Annual") if key == "period" else record[key] for key in ("year", "period", "sourceUrl", "all", "conventional", "organic")} for record in ordered]
        foods.append(latest)
    foods.sort(key=lambda f: (f.get("region", "GB"), f["category"], f["name"]))
    years = sorted({d["meta"]["year"] for d in datasets}, reverse=True)
    latest_source = next((source.url for source in reversed(SOURCES) if source.year == max(years)), SOURCE_PAGE)
    return {"meta": {"title": "Latest pesticide residue results for foods monitored in the UK", "year": max(years), "years": years, "region": "Great Britain and Northern Ireland", "sourceUrl": latest_source, "sourcePage": SOURCE_PAGE, "licence": "UK Open Government Licence v3.0", "generatedNote": "Each entry shows its latest included UK survey between 2016 and 2026; years are not silently pooled."}, "foods": foods}


def main() -> None:
    by_year = {}
    with TemporaryDirectory(prefix="uk-pesticides-") as temporary_directory:
        for source in SOURCES:
            path = Path(temporary_directory) / f"{source.key}.ods"
            request = urllib.request.Request(source.url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(request) as response: path.write_bytes(response.read())
            groups = workbook_groups(path, source)
            by_year.setdefault(source.year, []).append((source, groups))
            print(f"Read {len(groups)} food/region groups from {source.key}")
    datasets = []
    for year, groups in sorted(by_year.items()):
        payload = build_year(year, groups); datasets.append(payload)
        output = OUTPUT_DIRECTORY / f"uk-pesticides-{year}.json"
        output.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote {len(payload['foods'])} entries to {output}")
    combined = combine_latest(datasets)
    output = OUTPUT_DIRECTORY / "uk-pesticides-latest.json"
    output.write_text(json.dumps(combined, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(combined['foods'])} latest entries to {output}")


if __name__ == "__main__": main()
