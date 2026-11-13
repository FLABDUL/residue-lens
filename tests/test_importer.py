from __future__ import annotations

import sys
import unittest
import json
from pathlib import Path
from xml.etree import ElementTree


ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import import_uk_ods as importer  # noqa: E402


class ImporterTests(unittest.TestCase):
    def test_parse_result_extracts_measurement_and_mrl(self) -> None:
        parsed = importer.parse_result("acetamiprid 0.12 (MRL = 0.5*)")
        self.assertEqual(parsed, {"name": "acetamiprid", "concentration": 0.12, "mrl": 0.5})

    def test_parse_result_accepts_reporting_limit_markers(self) -> None:
        parsed = importer.parse_result("glyphosate <0.01 (MRL = 10)")
        self.assertEqual(parsed, {"name": "glyphosate", "concentration": 0.01, "mrl": 10.0})

    def test_parse_result_accepts_missing_mrl(self) -> None:
        parsed = importer.parse_result("fluazifop-p (partial sum) 0.03 (No MRL)")
        self.assertEqual(parsed, {"name": "fluazifop-p (partial sum)", "concentration": 0.03, "mrl": None})

    def test_parse_result_accepts_known_source_variants(self) -> None:
        cases = {
            "trifloxystrobin 0.03 ((MRL = 0.7))": {"name": "trifloxystrobin", "concentration": 0.03, "mrl": 0.7},
            "fenhexamid 0.05 (MRL = 15L)": {"name": "fenhexamid", "concentration": 0.05, "mrl": 15.0},
            "pirimiphos-methyl 0.03 (MRL N/A)": {"name": "pirimiphos-methyl", "concentration": 0.03, "mrl": None},
            "spirotetramat (sum) 2 .9 (MRL = 2)": {"name": "spirotetramat (sum)", "concentration": 2.9, "mrl": 2.0},
            "chlorate 0.3 (MRL = 0.1) !": {"name": "chlorate", "concentration": 0.3, "mrl": 0.1},
        }
        for source, expected in cases.items():
            with self.subTest(source=source):
                self.assertEqual(importer.parse_result(source), expected)

    def test_parse_result_rejects_non_result_text(self) -> None:
        self.assertIsNone(importer.parse_result("None were detected"))

    def test_rates_handle_empty_cohorts(self) -> None:
        self.assertEqual(importer.rate(0, 0), 0)
        self.assertEqual(importer.rate(1, 3), 33.3)

    def test_percentile_is_deterministic(self) -> None:
        self.assertEqual(importer.percentile([1, 4, 2, 3], 0.95), 4)
        self.assertEqual(importer.percentile([], 0.95), 0)

    def test_sample_rows_join_continuation_results(self) -> None:
        xml = f"""
        <table:table xmlns:table="{importer.TABLE_NS}">
          <table:table-row>{''.join('<table:table-cell></table:table-cell>' for _ in range(9))}</table:table-row>
          <table:table-row>
            <table:table-cell><text:p xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">2024/0001 Organic</text:p></table:table-cell>
            {''.join('<table:table-cell></table:table-cell>' for _ in range(7))}
            <table:table-cell><text:p xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">acetamiprid 0.2 (MRL = 1)</text:p></table:table-cell>
          </table:table-row>
          <table:table-row>
            {''.join('<table:table-cell></table:table-cell>' for _ in range(8))}
            <table:table-cell><text:p xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">azoxystrobin 0.3 (MRL = 2)</text:p></table:table-cell>
          </table:table-row>
        </table:table>
        """
        samples = importer.parse_sheet(ElementTree.fromstring(xml))
        self.assertEqual(len(samples), 1)
        self.assertTrue(samples[0]["organic"])
        self.assertEqual(len(samples[0]["residues"]), 2)

    def test_unrecognised_result_format_fails_closed(self) -> None:
        xml = f"""
        <table:table xmlns:table="{importer.TABLE_NS}">
          <table:table-row>
            <table:table-cell><text:p xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">2024/0001</text:p></table:table-cell>
            {''.join('<table:table-cell></table:table-cell>' for _ in range(7))}
            <table:table-cell><text:p xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">unexpected quantified result</text:p></table:table-cell>
          </table:table-row>
        </table:table>
        """
        with self.assertRaisesRegex(ValueError, "Unrecognised quantified residue result"):
            importer.parse_sheet(ElementTree.fromstring(xml))

    def test_missing_mrl_counts_as_detection_not_exceedance(self) -> None:
        samples = [
            {"id": "2017/0001", "organic": False, "residues": [{"name": "fluazifop-p", "concentration": 0.03, "mrl": None}]},
            {"id": "2017/0002", "organic": False, "residues": []},
        ]
        food = importer.aggregate(("soya-products", "Soya products", "Drinks & processed"), samples, 2017, "https://example.test/source.ods", "GB", "Annual")
        self.assertEqual(food["all"]["detectedPct"], 50)
        self.assertEqual(food["all"]["aboveMrlPct"], 0)
        self.assertIsNone(food["topResidues"][0]["typicalMrlMgKg"])

    def test_commodity_names_are_normalised(self) -> None:
        self.assertEqual(importer.normalise_commodity("Sweet Peppers"), "sweet peppers")
        self.assertEqual(importer.commodity_from_sheet("Peppers Sweet_BNA"), ("sweet-peppers", "Sweet peppers", "Vegetables"))

    def test_release_suffixes_do_not_create_duplicate_foods(self) -> None:
        first = importer.sheet_identity("Carrots_2_(EU)_Q2-Q4_NI_BNA")
        second = importer.sheet_identity("Carrots_Q1_NI_BNA")
        self.assertEqual(first, second)
        self.assertEqual(first[1], "NI")

    def test_duplicate_samples_are_joined_once(self) -> None:
        samples = [
            {"id": "2025/0001", "organic": False, "residues": [{"name": "A", "concentration": 1.0, "mrl": 2.0}]},
            {"id": "2025/0001", "organic": False, "residues": [{"name": "B", "concentration": 1.0, "mrl": 2.0}]},
        ]
        deduplicated = importer.deduplicate(samples)
        self.assertEqual(len(deduplicated), 1)
        self.assertEqual(len(deduplicated[0]["residues"]), 2)

    def test_latest_dataset_keeps_unpooled_history(self) -> None:
        def record(year: int, detected: float) -> dict:
            metrics = {"samples": 10, "detectedPct": detected, "multiplePct": 0, "aboveMrlPct": 0}
            return {"id": "apples", "canonicalId": "apples", "name": "Apples", "category": "Fruit", "region": "GB", "period": "Annual", "year": year, "sourceUrl": f"https://example.test/{year}", "all": metrics, "conventional": metrics, "organic": {**metrics, "samples": 0}, "topResidues": []}

        datasets = [
            {"meta": {"year": 2023}, "foods": [record(2023, 20)]},
            {"meta": {"year": 2024}, "foods": [record(2024, 40)]},
        ]
        combined = importer.combine_latest(datasets)
        food = combined["foods"][0]
        self.assertEqual(food["year"], 2024)
        self.assertEqual(food["conventional"]["detectedPct"], 40)
        self.assertEqual([entry["year"] for entry in food["history"]], [2024, 2023])

    def test_checked_in_soya_products_match_published_detection_count(self) -> None:
        payload = json.loads((ROOT / "src" / "data" / "uk-pesticides-2017.json").read_text(encoding="utf-8"))
        soya = next(food for food in payload["foods"] if food["id"] == "soya-products")
        self.assertEqual(soya["all"]["samples"], 51)
        self.assertEqual(soya["all"]["detectedPct"], 13.7)
        self.assertEqual(soya["conventional"]["samples"], 36)
        self.assertEqual(soya["conventional"]["detectedPct"], 19.4)
        self.assertEqual(soya["organic"]["detectedPct"], 0)


if __name__ == "__main__":
    unittest.main()
