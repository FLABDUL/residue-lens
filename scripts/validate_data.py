"""Fail fast when checked-in residue aggregates violate expected invariants."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).parents[1]


def validate_file(path: Path) -> list[str]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    errors: list[str] = []
    ids: set[str] = set()

    if not payload.get("foods"):
        errors.append(f"{path.name}: no foods")

    for food in payload.get("foods", []):
        label = f"{path.name}/{food.get('id', '<missing>')}"
        if food.get("id") in ids:
            errors.append(f"{label}: duplicate id")
        ids.add(food.get("id"))
        if not isinstance(food.get("year"), int):
            errors.append(f"{label}: missing survey year")
        region = food.get("region")
        if not isinstance(region, str) or not (2 <= len(region) <= 3):
            errors.append(f"{label}: invalid or missing region")
        if not food.get("programmeId") or not food.get("programme"):
            errors.append(f"{label}: missing monitoring programme")
        if not food.get("canonicalId") or not food.get("period"):
            errors.append(f"{label}: missing catalogue identity or period")
        if not str(food.get("sourceUrl", "")).startswith("https://"):
            errors.append(f"{label}: missing source URL")

        all_samples = food["all"]["samples"]
        split_samples = food["conventional"]["samples"] + food["organic"]["samples"]
        if all_samples != split_samples:
            errors.append(f"{label}: all samples do not equal conventional + organic")

        for cohort in ("all", "conventional", "organic"):
            metrics = food[cohort]
            if metrics["samples"] < 0:
                errors.append(f"{label}/{cohort}: negative sample count")
            for metric in ("detectedPct", "residueFreePct", "multiplePct", "aboveMrlPct"):
                if not 0 <= metrics[metric] <= 100:
                    errors.append(f"{label}/{cohort}/{metric}: outside 0–100")
            if abs(metrics["detectedPct"] + metrics["residueFreePct"] - 100) > 0.2 and metrics["samples"]:
                errors.append(f"{label}/{cohort}: detected and residue-free rates do not sum to 100")
            if metrics["multiplePct"] > metrics["detectedPct"]:
                errors.append(f"{label}/{cohort}: multiple-residue rate exceeds detection rate")
            if metrics["medianResidues"] < 0 or metrics["maxResidues"] < metrics["medianResidues"]:
                errors.append(f"{label}/{cohort}: invalid residue-count distribution")

        for residue in food["topResidues"]:
            if residue["detections"] > all_samples:
                errors.append(f"{label}/{residue['name']}: detections exceed samples")
            concentrations = [residue["medianMgKg"], residue["highMgKg"]]
            if residue["typicalMrlMgKg"] is not None:
                concentrations.append(residue["typicalMrlMgKg"])
            if min(concentrations) < 0:
                errors.append(f"{label}/{residue['name']}: negative concentration")

        history = food.get("history", [])
        if history:
            years = [entry.get("year") for entry in history]
            if years != sorted(years, reverse=True) or len(years) != len(set(years)):
                errors.append(f"{label}: history years must be unique and newest first")
            if years[0] != food.get("year"):
                errors.append(f"{label}: latest history year does not match food year")
            if any(not entry.get("period") for entry in history):
                errors.append(f"{label}: history entry missing period")

    return errors


def main() -> None:
    files = sorted((ROOT / "src" / "data").glob("*-pesticides-*.json"))
    errors = [error for path in files for error in validate_file(path)]
    if errors:
        raise SystemExit("Data validation failed:\n- " + "\n- ".join(errors))
    print(f"Validated {len(files)} datasets with no invariant failures.")


if __name__ == "__main__":
    main()
