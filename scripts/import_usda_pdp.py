"""Build a programme-separated US catalogue from official USDA PDP archives.

The importer streams the large analytical-result files and stores aggregates,
not individual sample records. It deliberately keeps USDA results separate from
UK monitoring because their sampling plans and regulatory limits differ.
"""

from __future__ import annotations

import argparse
import json
import re
import statistics
import urllib.request
import urllib.error
import zipfile
from collections import Counter, defaultdict
from pathlib import Path
from tempfile import TemporaryDirectory

import openpyxl
import xlrd
from combine_datasets import build_global


ROOT = Path(__file__).parents[1]
CACHE = ROOT / ".cache" / "usda-pdp"
OUTPUT = ROOT / "src" / "data" / "us-pesticides-latest.json"
GLOBAL_OUTPUT = ROOT / "src" / "data" / "global-pesticides-latest.json"
SOURCE_PAGE = "https://www.ams.usda.gov/datasets/pdp/pdpdata"
YEARS = tuple(range(1994, 2025))
POSITIVE_MEAN_CODES = {"O", "A", "R"}


def slugify(value: str) -> str:
    value = value.lower().replace("&", " and ")
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", value)).strip("-")


def category_for(name: str) -> str:
    text = name.lower()
    if "baby food" in text or "infant" in text: return "Baby food"
    if any(word in text for word in ("beef", "bovine", "pork", "swine", "pig", "chicken", "poultry", "turkey", "milk", "dairy", "egg", "salmon", "catfish", "fish", "meat", "liver", "honey")): return "Meat, fish & dairy"
    if any(word in text for word in ("juice", "sauce", "butter", "canned", "frozen", "dried", "oil", "water")): return "Drinks & processed"
    if any(word in text for word in ("basil", "cilantro", "coriander", "parsley", "mint", "thyme", "rosemary", "oregano", "sage", "spice", "peppercorn")): return "Herbs & spices"
    if any(word in text for word in ("barley", "maize", "corn grain", "oat", "rice", "rye", "wheat", "flour", "cereal", "bean", "chickpea", "lentil", "almond", "peanut", "nut", "seed")): return "Grains & staples"
    if any(word in text for word in ("apple", "apricot", "avocado", "banana", "berry", "berries", "cherry", "cherries", "date", "fig", "grape", "grapefruit", "kiwi", "lemon", "lime", "mandarin", "mango", "melon", "nectarine", "orange", "papaya", "peach", "pear", "pineapple", "plum", "strawber", "tangerine", "pomegranate", "currant")): return "Fruit"
    return "Vegetables"


def download(year: int) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / f"{year}.zip"
    if not path.exists():
        print(f"Downloading {year} PDP archive")
        for extension in ("zip", "ZIP"):
            url = f"https://www.ams.usda.gov/sites/default/files/media/{year}PDPDatabase.{extension}"
            request = urllib.request.Request(url, headers={"User-Agent": "Residue Lens data importer (public-data research)"})
            try:
                with urllib.request.urlopen(request, timeout=120) as response:
                    path.write_bytes(response.read())
                break
            except urllib.error.HTTPError as error:
                if error.code != 404 or extension == "ZIP": raise
    return path


def sheet_rows(path: Path, wanted: str) -> list[list[object]]:
    if path.suffix.lower() == ".xlsx":
        workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
        try:
            name = next(name for name in workbook.sheetnames if name.lower().startswith(wanted.lower()))
            return [list(row) for row in workbook[name].iter_rows(values_only=True)]
        finally:
            workbook.close()
    workbook = xlrd.open_workbook(path)
    try:
        name = next(name for name in workbook.sheet_names() if name.lower().startswith(wanted.lower()))
        sheet = workbook.sheet_by_name(name)
        return [sheet.row_values(index) for index in range(sheet.nrows)]
    finally:
        workbook.release_resources()


def mapping(path: Path, sheet: str, first_header: str) -> dict[str, str]:
    rows = sheet_rows(path, sheet)
    header = next(index for index, row in enumerate(rows) if row and str(row[0]).strip().lower() == first_header.lower())
    return {str(row[0]).strip().zfill(3) if sheet == "Pest Code" else str(row[0]).strip(): str(row[1]).strip() for row in rows[header + 1:] if len(row) > 1 and str(row[0]).strip()}


def tolerance_mapping(path: Path) -> dict[tuple[str, str], float]:
    rows = sheet_rows(path, "Toler")
    header = next(index for index, row in enumerate(rows) if row and any("tolerance" in str(cell).lower() for cell in row) and any("pest" in str(cell).lower() for cell in row))
    labels = [str(cell).strip().lower() for cell in rows[header]]
    commodity_index = next(index for index, label in enumerate(labels) if "commod" in label)
    pest_index = next(index for index, label in enumerate(labels) if "pest" in label)
    tolerance_index = next(index for index, label in enumerate(labels) if "tolerance" in label and "code" not in label)
    unit_index = next(index for index, label in enumerate(labels) if "unit" in label or "pp_" in label)
    values: dict[tuple[str, str], float] = {}
    for row in rows[header + 1:]:
        if len(row) <= max(commodity_index, pest_index, tolerance_index, unit_index): continue
        pest, commodity = str(row[pest_index]).strip().zfill(3), str(row[commodity_index]).strip()
        raw, unit = str(row[tolerance_index]).strip(), str(row[unit_index]).strip().upper()
        try: value = float(raw)
        except ValueError: continue
        values[(pest, commodity)] = value / 1000 if unit == "B" else value
    return values


def reference_file(directory: Path) -> Path:
    files = list(directory.glob("*ReferenceTables*.xlsx")) + list(directory.glob("*ReferenceTables*.xls"))
    if not files: raise RuntimeError("Reference workbook missing")
    return files[0]


def rate(count: int, total: int) -> float:
    return round(count / total * 100, 1) if total else 0


def metrics(samples: list[dict]) -> dict:
    return {
        "samples": len(samples),
        "detectedPct": rate(sum(bool(sample["residues"]) for sample in samples), len(samples)),
        "multiplePct": rate(sum(len(sample["residues"]) >= 2 for sample in samples), len(samples)),
        "aboveMrlPct": rate(sum(any(result["above"] for result in sample["residues"]) for sample in samples), len(samples)),
        "residueFreePct": rate(sum(not sample["residues"] for sample in samples), len(samples)),
        "medianResidues": round(statistics.median([len(sample["residues"]) for sample in samples]), 1) if samples else 0,
        "maxResidues": max((len(sample["residues"]) for sample in samples), default=0),
    }


def parse_year(year: int, archive_path: Path) -> list[dict]:
    with TemporaryDirectory(prefix=f"pdp-{year}-") as temporary:
        directory = Path(temporary)
        with zipfile.ZipFile(archive_path) as archive: archive.extractall(directory)
        reference = reference_file(directory)
        commodities = mapping(reference, "Commodity", "Commodity Code")
        pesticides = mapping(reference, "Pest Code", "Pest Code")
        countries = mapping(reference, "Country", "Country Code")
        tolerances = tolerance_mapping(reference)
        sample_path = next(directory.glob("*Samples.txt"))
        result_path = next(directory.glob("*Results.txt"))
        samples: dict[int, dict] = {}
        with sample_path.open(encoding="latin-1") as handle:
            for line in handle:
                row = line.rstrip("\r\n").split("|")
                if len(row) < 14: continue
                key = int(row[0]); claim = row[13].strip(); origin = row[9].strip(); country = row[10].strip()
                samples[key] = {"commodity": row[6].strip(), "organic": claim == "PO", "origin": origin, "country": country, "residues": []}
        with result_path.open(encoding="latin-1") as handle:
            for line in handle:
                row = line.rstrip("\r\n").split("|")
                if len(row) < 14 or not row[6].strip(): continue
                try: concentration = float(row[6])
                except ValueError: continue
                if row[13].strip() not in POSITIVE_MEAN_CODES and concentration <= 0: continue
                sample = samples.get(int(row[0])); pest = row[4].strip().zfill(3)
                if not sample: continue
                if row[8].strip().upper() == "B": concentration /= 1000
                tolerance = tolerances.get((pest, sample["commodity"]))
                sample["residues"].append({"name": pesticides.get(pest, pest), "concentration": concentration, "mrl": tolerance, "above": tolerance is not None and concentration > tolerance})

        grouped: dict[str, list[dict]] = defaultdict(list)
        for sample in samples.values(): grouped[sample["commodity"]].append(sample)
        foods = []
        for commodity_code, rows in grouped.items():
            name = commodities.get(commodity_code, commodity_code)
            slug = slugify(name)
            conventional = [sample for sample in rows if not sample["organic"]]
            organic = [sample for sample in rows if sample["organic"]]
            residues = [result for sample in rows for result in sample["residues"]]
            frequencies = Counter(result["name"] for result in residues)
            details = []
            for residue_name, count in frequencies.most_common(20):
                matches = [result for result in residues if result["name"] == residue_name]
                concentrations = sorted(float(result["concentration"]) for result in matches)
                mrls = [float(result["mrl"]) for result in matches if result["mrl"] is not None]
                details.append({"name": residue_name, "detections": count, "samplePct": rate(count, len(rows)), "medianMgKg": round(statistics.median(concentrations), 4), "highMgKg": round(concentrations[round((len(concentrations) - 1) * .95)], 4), "typicalMrlMgKg": round(statistics.median(mrls), 4) if mrls else 0})
            country_counts = Counter(countries.get(sample["country"], sample["country"]) for sample in rows if sample["country"])
            foods.append({
                "id": f"us-{slug}", "canonicalId": slug, "name": name, "category": category_for(name),
                "region": "US", "market": "United States", "programmeId": "usda-pdp", "programme": "USDA Pesticide Data Program",
                "year": year, "period": "Calendar year", "sourceUrl": SOURCE_PAGE,
                "all": metrics(rows), "conventional": metrics(conventional), "organic": metrics(organic),
                "topResidues": details, "origin": {"domesticSamples": sum(sample["origin"] == "1" for sample in rows), "importedSamples": sum(sample["origin"] == "2" for sample in rows), "unknownSamples": sum(sample["origin"] not in {"1", "2"} for sample in rows), "topCountries": [{"country": country, "samples": count} for country, count in country_counts.most_common(8)]},
            })
        print(f"Parsed {year}: {len(samples):,} samples, {len(foods)} commodities")
        return foods


def combine_years(years: list[tuple[int, list[dict]]]) -> dict:
    versions: dict[str, list[dict]] = defaultdict(list)
    for _, foods in years:
        for food in foods: versions[food["id"]].append(food)
    latest = []
    for records in versions.values():
        ordered = sorted(records, key=lambda food: food["year"], reverse=True)
        food = dict(ordered[0])
        food["history"] = [{key: record[key] for key in ("year", "period", "sourceUrl", "all", "conventional", "organic")} for record in ordered]
        latest.append(food)
    latest.sort(key=lambda food: (food["category"], food["name"]))
    return {"meta": {"title": "USDA Pesticide Data Program food residue results", "year": max(year for year, _ in years), "years": sorted((year for year, _ in years), reverse=True), "region": "United States", "sourceUrl": SOURCE_PAGE, "sourcePage": SOURCE_PAGE, "licence": "United States Government public data", "generatedNote": "Each commodity shows its latest PDP survey. Programme results are not pooled with other countries."}, "foods": latest}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--years", default="all", help="Comma-separated years or 'all'")
    args = parser.parse_args()
    selected = YEARS if args.years == "all" else tuple(int(value) for value in args.years.split(","))
    datasets = [(year, parse_year(year, download(year))) for year in selected]
    us_dataset = combine_years(datasets)
    OUTPUT.write_text(json.dumps(us_dataset, indent=2) + "\n", encoding="utf-8")
    build_global()
    print(f"Wrote {len(us_dataset['foods'])} latest US commodities to {OUTPUT}")
    print(f"Wrote combined catalogue to {GLOBAL_OUTPUT}")


if __name__ == "__main__": main()
