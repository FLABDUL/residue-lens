import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import data from "@/data/global-pesticides-latest.json";
import type { Dataset } from "@/data/types";

const dataset = data as Dataset;
const uniqueFoods = new Set(dataset.foods.map((food) => food.canonicalId)).size;
const reportingAreas = new Set(dataset.foods.map((food) => food.region)).size;

export const metadata: Metadata = {
  title: "Methodology | Residue Lens",
  description: "How Residue Lens processes official UK, US and European pesticide-residue monitoring data without pooling unlike programmes.",
};

export default function MethodologyPage() {
  return <ContentPage eyebrow="Methodology" title="Every number has a visible trail." intro="Residue Lens processes sample-level records from three official monitoring sources and keeps their countries, programmes and rules separate.">
    <h2>Source and scope</h2>
    <p>The current catalogue contains {uniqueFoods.toLocaleString("en-GB")} named foods and preparations across {dataset.foods.length.toLocaleString("en-GB")} programme-and-market entries in {reportingAreas} reporting areas. Each entry uses its latest included survey. Survey years, regions and programmes are never silently pooled, and these targeted samples should not be treated as a random estimate of every item on sale.</p>
    <h2>Three source programmes</h2>
    <dl>
      <dt>UK Pesticide Residues in Food monitoring, 2016–2026</dt><dd>Annual and final quarterly ODS workbooks for Great Britain and Northern Ireland. PRiF advised on the programme historically, but closed on 30 June 2026 and had no input into 2026 reporting. The importer joins continuation rows, deduplicates official sample identifiers and compares measurements with the MRL printed in each record.</dd>
      <dt>USDA Pesticide Data Program, 1994–2024</dt><dd>Annual sample and result files with rotating commodities. Detections, organic claims, origins and EPA tolerance fields are aggregated independently for each commodity and year.</dd>
      <dt>EFSA consolidated official controls, 2024</dt><dd>National, EU and combined official-programme occurrence records are grouped by reporting country and food. Country sampling strategies and coverage differ, so the app requires one country at a time and does not create a league table.</dd>
    </dl>
    <h2>UK release policy</h2><p>The latest included final UK release is Q1 2026. HSE also publishes rolling monthly files, currently through June 2026, but Residue Lens does not mix those provisional rolling releases into final-quarter comparisons. An automated source check alerts the project when a newer final quarterly workbook is listed; import and food mappings still require review before publication.</p>
    <h2>Common calculations</h2>
    <ol><li>Group analytical rows by the source programme’s sample identifier.</li><li>Count a sample once for “any residue” when at least one result is quantified.</li><li>Count “multiple residues” when two or more results are quantified on the same sample.</li><li>Report the complementary share with no quantified residue.</li><li>Calculate the median and maximum number of quantified residues per sample.</li><li>Separate conventional and identified organic samples, withholding the comparison below five organic samples.</li><li>Preserve the source’s compliance field or regulatory-limit basis rather than translating it into a health-risk score.</li></ol>
    <h2>Above-limit results</h2>
    <p>The meaning follows the source. UK figures are a reproducible comparison with the printed MRL, USDA figures use recorded EPA tolerances, and EFSA figures use the reporting authority’s non-compliance field. These are regulatory compliance measures, not standalone evidence of consumer harm; exposure and toxicology assessment are separate.</p>
    <h2 id="organic-comparisons">Sample coverage and organic comparisons</h2><p>Labels describe the amount of monitoring evidence: limited below 20 samples, moderate at 20–49, and broader at 50 or more. They are not statistical confidence grades. An organic comparison is displayed only when the same food entry contains at least five samples identified as organic. The app does not pool years, regions or monitoring programmes to reach that threshold.</p>
    <h2>Pesticide types</h2><p>Functional categories describe a substance’s usual agricultural role. They are explanatory labels, not hazard rankings; some substances and grouped analytical results remain “other / mixed”.</p>
    <h2>Reproducibility and licences</h2><p>The importers, validation scripts and regression tests are kept with the website code. UK material is attributed under the Open Government Licence; US federal data is generally not subject to US copyright; EFSA material is reused with acknowledgement under its legal notice. Follow the source link on an individual food page for the underlying release.</p>
    <ul><li><a href="https://www.data.gov.uk/dataset/5d5028ef-9918-4ab7-8755-81f3ad06f308/pesticide-residues-in-food" target="_blank" rel="noreferrer">UK official catalogue ↗</a></li><li><a href="https://www.ams.usda.gov/datasets/pdp/pdpdata" target="_blank" rel="noreferrer">USDA PDP data ↗</a></li><li><a href="https://zenodo.org/records/18327007" target="_blank" rel="noreferrer">EFSA 2024 occurrence data ↗</a></li></ul>
  </ContentPage>;
}
