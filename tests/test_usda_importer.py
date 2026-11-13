from __future__ import annotations

import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import import_usda_pdp as importer  # noqa: E402


class UsdaImporterTests(unittest.TestCase):
    def test_slug_and_category_keep_preparations_distinct(self) -> None:
        self.assertEqual(importer.slugify("Blackberries, Frozen"), "blackberries-frozen")
        self.assertEqual(importer.category_for("Blackberries, Frozen"), "Drinks & processed")
        self.assertEqual(importer.category_for("Baby Food - Carrots"), "Baby food")

    def test_metrics_cover_detection_and_residue_counts(self) -> None:
        rows = [
            {"residues": []},
            {"residues": [{"above": False}]},
            {"residues": [{"above": False}, {"above": True}]},
        ]
        metrics = importer.metrics(rows)
        self.assertEqual(metrics["detectedPct"], 66.7)
        self.assertEqual(metrics["residueFreePct"], 33.3)
        self.assertEqual(metrics["multiplePct"], 33.3)
        self.assertEqual(metrics["aboveMrlPct"], 33.3)
        self.assertEqual(metrics["medianResidues"], 1)
        self.assertEqual(metrics["maxResidues"], 2)


if __name__ == "__main__": unittest.main()
