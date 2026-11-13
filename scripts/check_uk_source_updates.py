"""Alert when a final UK quarterly release is newer than the checked-in data."""

from __future__ import annotations

import json
import re
import sys
from typing import Any
from urllib.request import urlopen

DATASET_API = "https://ckan.publishing.service.gov.uk/api/3/action/package_show?id=5d5028ef-9918-4ab7-8755-81f3ad06f308"
INCLUDED_FINAL_QUARTER = (2026, 1)
QUARTER_PATTERN = re.compile(r"quarterly data sets:\s*Q([1-4])\s+(20\d{2})", re.IGNORECASE)


def quarter_key(name: str | None) -> tuple[int, int] | None:
    match = QUARTER_PATTERN.search(name or "")
    return (int(match.group(2)), int(match.group(1))) if match else None


def find_newer_final_quarters(resources: list[dict[str, Any]], included: tuple[int, int]) -> list[dict[str, Any]]:
    return [resource for resource in resources if (quarter_key(resource.get("name")) or (0, 0)) > included]


def main() -> int:
    with urlopen(DATASET_API, timeout=30) as response:  # noqa: S310 - fixed official HTTPS endpoint
        payload = json.load(response)

    resources = payload["result"]["resources"]
    newer = find_newer_final_quarters(resources, INCLUDED_FINAL_QUARTER)
    if newer:
        print("A newer final UK quarterly release needs review before import:", file=sys.stderr)
        for resource in newer:
            print(f"- {resource.get('name')}: {resource.get('url')}", file=sys.stderr)
        return 1

    rolling = [resource for resource in resources if "rolling reporting" in (resource.get("name") or "").lower()]
    latest_rolling = max(rolling, key=lambda resource: resource.get("created") or "", default=None)
    print("No final UK quarterly release is newer than Q1 2026.")
    if latest_rolling:
        print(f"Latest rolling release (not mixed into final-quarter comparisons): {latest_rolling.get('name')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
