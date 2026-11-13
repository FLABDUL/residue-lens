"""Combine source aggregates without pooling their monitoring results."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).parents[1]
DATA = ROOT / "src" / "data"
OUTPUT = DATA / "global-pesticides-latest.json"
INPUTS = (
    (DATA / "uk-pesticides-latest.json", {"id": "uk-prif", "name": "UK monitoring", "market": "United Kingdom"}),
    (DATA / "us-pesticides-latest.json", {"id": "usda-pdp", "name": "USDA PDP", "market": "United States"}),
    (DATA / "eu-pesticides-2024.json", {"id": "efsa-controls", "name": "EFSA consolidated official controls", "market": "EU and EEA"}),
)


def complete_metrics(metrics: dict) -> None:
    metrics.setdefault("residueFreePct", round(100 - metrics["detectedPct"], 1))
    metrics.setdefault("medianResidues", 0)
    metrics.setdefault("maxResidues", 0)


def build_global() -> dict:
    foods, programmes, years = [], [], set()
    for path, programme in INPUTS:
        if not path.exists(): continue
        dataset = json.loads(path.read_text(encoding="utf-8"))
        programmes.append({**programme, "sourceUrl": dataset["meta"]["sourcePage"]})
        years.update(dataset["meta"].get("years", [dataset["meta"]["year"]]))
        for food in dataset["foods"]:
            food.setdefault("programmeId", programme["id"])
            food.setdefault("programme", programme["name"])
            food.setdefault("market", programme["market"])
            for cohort in ("all", "conventional", "organic"): complete_metrics(food[cohort])
            for history in food.get("history", []):
                for cohort in ("all", "conventional", "organic"): complete_metrics(history[cohort])
            foods.append(food)
    payload = {"meta": {"title": "Official pesticide residue monitoring by programme", "year": max(years), "years": sorted(years, reverse=True), "region": ", ".join(programme["market"] for programme in programmes), "sourceUrl": programmes[0]["sourceUrl"], "sourcePage": "/methodology", "licence": "Source-specific public-data terms", "generatedNote": "Results remain separated by monitoring programme and are never pooled into a country league table.", "programmes": programmes}, "foods": foods}
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return payload


if __name__ == "__main__":
    dataset = build_global()
    print(f"Wrote {len(dataset['foods'])} programme entries to {OUTPUT}")
