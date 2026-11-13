import unittest

from scripts.check_uk_source_updates import find_newer_final_quarters, quarter_key


class SourceUpdateTests(unittest.TestCase):
    def test_quarter_key_accepts_current_catalogue_labels(self):
        self.assertEqual(quarter_key("Pesticide residues in food quarterly data sets: Q1 2026"), (2026, 1))
        self.assertEqual(quarter_key("June 2026 Rolling Reporting"), None)

    def test_reports_only_final_quarters_newer_than_the_included_release(self):
        resources = [
            {"name": "May 2026 Rolling Reporting", "url": "https://example.test/may.ods"},
            {"name": "Pesticide residues in food quarterly data sets: Q1 2026", "url": "https://example.test/q1.ods"},
            {"name": "Pesticide residues in food quarterly data sets: Q2 2026", "url": "https://example.test/q2.ods"},
        ]

        self.assertEqual(find_newer_final_quarters(resources, (2026, 1)), [resources[2]])


if __name__ == "__main__":
    unittest.main()
