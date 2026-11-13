"""Aggregate EFSA's consolidated 2024 official-control subset by reporting country."""

from __future__ import annotations

import csv
import io
import json
import re
import statistics
import urllib.request
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

from combine_datasets import build_global
from import_usda_pdp import category_for, metrics, rate, slugify


ROOT = Path(__file__).parents[1]
CACHE = ROOT / ".cache" / "efsa"
OUTPUT = ROOT / "src" / "data" / "eu-pesticides-2024.json"
SOURCE_PAGE = "https://zenodo.org/records/18327007"
DOWNLOAD = "https://zenodo.org/records/18327007/files/Annex%20VIII.zip?download=1"
PROGRAMMES = {"Official (National) programme", "Official (EU) programme", "Official (National and EU) programme"}


def archive_path() -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / "annex-viii-2024.zip"
    if not path.exists():
        print("Downloading EFSA 2024 occurrence subset (about 112 MB)")
        request = urllib.request.Request(DOWNLOAD, headers={"User-Agent": "Residue Lens data importer (public-data research)"})
        with urllib.request.urlopen(request, timeout=240) as response: path.write_bytes(response.read())
    return path


def number(value: str) -> float | None:
    try: return float(value)
    except (TypeError, ValueError): return None


def parse() -> list[dict]:
    samples: dict[str, dict] = {}
    with zipfile.ZipFile(archive_path()) as archive:
        csv_name = next(name for name in archive.namelist() if name.lower().endswith(".csv"))
        with io.TextIOWrapper(archive.open(csv_name), encoding="utf-8-sig", newline="") as handle:
            for row_number, row in enumerate(csv.DictReader(handle), 1):
                if row["progType_DESC"] not in PROGRAMMES: continue
                sample_id = row["sampId_A"]
                sample = samples.setdefault(sample_id, {
                    "countryCode": row["sampCountry"], "country": row["sampCountry_DESC"],
                    "food": row["sampMatCode_base_building_DESC"], "process": row["sampMatCode_process_DESC"],
                    "organic": row["organic"] == "1", "origin": row["origCountry"], "originName": row["origCountry_DESC"], "residues": [],
                })
                concentration = number(row["resVal"])
                if concentration is not None and row["BELOWQUANTLIMIT"] == "0":
                    mrl_ugkg = number(row["MRL_PPP_UGKG"])
                    sample["residues"].append({"name": row["REPORTNAME"], "concentration": concentration, "mrl": mrl_ugkg / 1000 if mrl_ugkg is not None else None, "above": row["PEST_NONCOMPLIANT"] == "1"})
                if row_number % 2_000_000 == 0: print(f"Read {row_number:,} EFSA analytical rows")

    grouped: dict[tuple[str, str, str], list[dict]] = defaultdict(list)
    for sample in samples.values(): grouped[(sample["countryCode"], sample["country"], sample["food"])].append(sample)
    foods = []
    for (country_code, country, raw_name), rows in grouped.items():
        name = re.sub(r"[.\-\s]+$", "", raw_name.strip())
        slug = slugify(name)
        conventional = [sample for sample in rows if not sample["organic"]]
        organic = [sample for sample in rows if sample["organic"]]
        residues = [result for sample in rows for result in sample["residues"]]
        frequencies = Counter(result["name"] for result in residues)
        details = []
        for residue_name, count in frequencies.most_common(20):
            matches = [result for result in residues if result["name"] == residue_name]
            concentrations = sorted(result["concentration"] for result in matches)
            mrls = [result["mrl"] for result in matches if result["mrl"] is not None]
            details.append({"name": residue_name, "detections": count, "samplePct": rate(count, len(rows)), "medianMgKg": round(statistics.median(concentrations), 4), "highMgKg": round(concentrations[round((len(concentrations) - 1) * .95)], 4), "typicalMrlMgKg": round(statistics.median(mrls), 4) if mrls else 0})
        origin_counts = Counter(sample["originName"] for sample in rows if sample["originName"])
        foods.append({"id": f"eu-{country_code.lower()}-{slug}", "canonicalId": slug, "name": name, "category": category_for(name), "region": country_code, "market": country, "programmeId": "efsa-controls", "programme": "EFSA consolidated official controls", "year": 2024, "period": "Calendar year", "sourceUrl": SOURCE_PAGE, "limitBasis": "Official reporting-country non-compliance flag", "all": metrics(rows), "conventional": metrics(conventional), "organic": metrics(organic), "topResidues": details, "origin": {"domesticSamples": sum(sample["origin"] == country_code for sample in rows), "importedSamples": sum(bool(sample["origin"]) and sample["origin"] != country_code for sample in rows), "unknownSamples": sum(not sample["origin"] for sample in rows), "topCountries": [{"country": origin, "samples": count} for origin, count in origin_counts.most_common(8)]}})
    foods.sort(key=lambda food: (food["market"], food["category"], food["name"]))
    print(f"Aggregated {len(samples):,} coordinated samples into {len(foods)} country/food entries")
    return foods


def main() -> None:
    foods = parse()
    payload = {"meta": {"title": "EFSA 2024 consolidated official pesticide control results", "year": 2024, "years": [2024], "region": "European Union, Iceland, Norway and Northern Ireland", "sourceUrl": SOURCE_PAGE, "sourcePage": SOURCE_PAGE, "licence": "EFSA reuse with acknowledgement; see EFSA legal notice", "generatedNote": "National, EU and combined national/EU official-programme records from EFSA's Annual Report subset are included and kept separate by reporting country. Sampling strategies differ, so countries must not be ranked against one another."}, "foods": foods}
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    build_global()
    print(f"Wrote EFSA aggregates to {OUTPUT}")


if __name__ == "__main__": main()
