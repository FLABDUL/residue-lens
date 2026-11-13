import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import data from "@/data/global-pesticides-latest.json";
import type { Dataset, FoodRecord, Metric, SampleMetrics } from "@/data/types";
import { FoodVisual } from "@/components/FoodVisual";
import { PriorityLegend } from "@/components/PriorityLegend";
import { ResidueTable } from "@/components/ResidueTable";
import { SaveFoodButton } from "@/components/SaveFoodButton";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { coverageLabel } from "@/lib/data-quality";
import { priorityBandForValue, rankPriorityBands, type PriorityResult } from "@/lib/priority-bands";

const dataset = data as Dataset;
export const dynamic = "force-static";

type Props = { params: Promise<{ slug: string }> };

function findFood(slug: string) {
  return dataset.foods.find((food) => food.id === slug);
}

function regionLabel(food: Pick<FoodRecord, "region" | "market">) {
  if (food.market) return food.market;
  if (food.region === "NI") return "Northern Ireland";
  if (food.region === "GB") return "Great Britain";
  if (food.region === "US") return "United States";
  return food.region;
}

function sourceLicence(food: FoodRecord) {
  if (food.programmeId === "usda-pdp") return "https://www.usa.gov/government-copyright";
  if (food.programmeId === "efsa-controls") return "https://www.efsa.europa.eu/en/legalnotice";
  return "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
}

function monitoringContext(food: FoodRecord) {
  if (food.programmeId === "usda-pdp") return "USDA PDP selects rotating commodities, with emphasis on foods important to consumer diets, including foods eaten by infants and children.";
  if (food.programmeId === "efsa-controls") return "EFSA consolidates official control results reported by national authorities; sampling strategies and food coverage differ between countries.";
  return "The UK programme is risk-based and targets foods where residues may be expected.";
}

function metricCard(label: string, value: number | string, detail: string, priority: PriorityResult) {
  return (
    <article className="food-metric" data-priority={priority.band}>
      <span>{label}</span>
      <strong>{typeof value === "number" ? `${value}%` : value}</strong>
      <small className="food-metric-priority">{priority.label}</small>
      <p>{detail}</p>
    </article>
  );
}

function samplesLabel(metrics: SampleMetrics) {
  return `${metrics.samples} sample${metrics.samples === 1 ? "" : "s"}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const food = findFood(slug);
  if (!food) return {};
  const description = `${food.conventional.detectedPct}% of ${food.conventional.samples} standard-grown ${food.name.toLowerCase()} samples had a quantified pesticide residue in the ${food.year} ${food.programme ?? `${regionLabel(food)} monitoring`} dataset.`;
  return {
    title: `${food.name}: pesticide residue results | Residue Lens`,
    description,
    alternates: { canonical: `/foods/${food.id}` },
    openGraph: { title: `${food.name}: pesticide residue results`, description, type: "article" },
  };
}

export default async function FoodPage({ params }: Props) {
  const { slug } = await params;
  const food = findFood(slug);
  if (!food) notFound();
  const description = `${food.conventional.detectedPct}% of standard-grown samples had at least one detected residue.`;
  const referenceFoods = dataset.foods.filter((item) => item.programmeId === food.programmeId && item.region === food.region);
  const metricBands = Object.fromEntries(
    (["detectedPct", "residueFreePct", "multiplePct", "aboveMrlPct", "medianResidues"] as const).map((metric) => [
      metric,
      rankPriorityBands(metric, referenceFoods.map((item) => ({
        id: item.id,
        value: item.conventional.samples > 0 ? item.conventional[metric] : null,
      }))),
    ]),
  ) as Record<Exclude<Metric, "organic">, Record<string, "lower" | "moderate" | "higher" | "neutral">>;
  const organicBands = rankPriorityBands("organic", referenceFoods.map((item) => ({
    id: item.id,
    value: item.organic.samples >= 5 ? Math.max(0, item.conventional.detectedPct - item.organic.detectedPct) : null,
  })));
  const priorityFor = (metric: Metric) => priorityBandForValue(food.id, metric === "organic" ? organicBands : metricBands[metric]);
  const coverage = coverageLabel(food.conventional.samples);
  const datasetStructuredData = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${food.name} pesticide residue results, ${regionLabel(food)} ${food.year}`,
    description,
    creator: {
      "@type": "Organization",
      name: "Residue Lens",
      url: "https://residuelens.com/about",
    },
    temporalCoverage: String(food.year),
    spatialCoverage: regionLabel(food),
    license: sourceLicence(food),
    isBasedOn: food.sourceUrl,
  };
  const questions = [
    { question: `Were pesticide residues detected on ${food.name.toLowerCase()}?`, answer: `${food.conventional.detectedPct}% of ${food.conventional.samples} standard-grown samples in the ${food.year} ${food.programme ?? `${regionLabel(food)} monitoring`} dataset had at least one quantified residue.` },
    { question: `Does that mean ${food.name.toLowerCase()} were unsafe?`, answer: "No. A laboratory detection is not, by itself, a consumer-risk finding. Regulators assess dietary risk separately." },
    { question: `Should I buy organic ${food.name.toLowerCase()}?`, answer: food.organic.samples >= 5 ? `The monitored organic samples had a ${food.organic.detectedPct}% detection rate, compared with ${food.conventional.detectedPct}% for standard-grown samples. This is a shopping-priority comparison, not a health-risk score.` : `There were only ${food.organic.samples} organic samples, so Residue Lens withholds the comparison.` },
  ];
  const faqStructuredData = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: questions.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) };

  return (
    <>
      <SiteHeader />

      <main className="food-page">
        <div className="food-breadcrumb"><Link href="/">All foods</Link><span>/</span><span>{food.name}</span></div>
        <section className="food-hero">
          <div>
            <p className="eyebrow">{food.year} · {regionLabel(food)} · {food.programme ?? "Official monitoring"} · {food.period}</p>
            <FoodVisual canonicalId={food.canonicalId} category={food.category} name={food.name} decorative />
            <h1>Pesticide residues found on <em>{food.name.toLowerCase()}</em></h1>
            <p>{description} Standard-grown means samples not identified as organic (called conventional in the source data). Detection does not, by itself, mean the food was unsafe.</p>
          </div>
          <aside>
            <span>Total samples</span><strong>{food.all.samples}</strong><p>Targeted government monitoring</p><small className={`coverage-badge coverage-${coverage.level}`}>{coverage.label}</small>
          </aside>
        </section>

        <div className="food-actions"><SaveFoodButton foodId={food.id} foodName={food.name} /><Link href={`/compare?foods=${food.id}&metric=detectedPct&programme=${food.programmeId ?? "uk-prif"}&region=${food.region}`}>Compare with other foods →</Link></div>

        <section className="food-metrics" aria-label={`${food.name} summary`}>
          {metricCard("Any residue", food.conventional.detectedPct, `${samplesLabel(food.conventional)}, standard-grown`, priorityFor("detectedPct"))}
          {metricCard("No quantified residue", food.conventional.residueFreePct, "All reported results below quantification", priorityFor("residueFreePct"))}
          {metricCard("Multiple residues", food.conventional.multiplePct, "Two or more residues detected", priorityFor("multiplePct"))}
          {metricCard("Median residue count", food.conventional.medianResidues.toLocaleString("en-GB", { maximumFractionDigits: 1 }), `Highest observed count: ${food.conventional.maxResidues}`, priorityFor("medianResidues"))}
          {metricCard("Above published limit", food.conventional.aboveMrlPct, food.programmeId === "usda-pdp" ? "Compared with the recorded EPA tolerance" : food.programmeId === "efsa-controls" ? "Based on the reported compliance evaluation" : "Parser-based MRL comparison", priorityFor("aboveMrlPct"))}
          {food.organic.samples >= 5
            ? metricCard("Organic: any residue", food.organic.detectedPct, `${samplesLabel(food.organic)}, interpret cautiously`, priorityFor("organic"))
            : metricCard("Organic comparison", "Not available", `Withheld: only ${samplesLabel(food.organic)}`, priorityFor("organic"))}
        </section>
        <PriorityLegend />

        {food.history && food.history.length > 1 ? <section className="food-history" aria-labelledby="history-title">
          <div><p className="eyebrow">Annual context</p><h2 id="history-title">How monitored results changed</h2><p>Each row is a separate targeted survey. Samples can differ by retailer, origin and season, so this is context rather than a trend claim.</p></div>
          <div><div className="table-scroll"><table><thead><tr><th>Year</th><th>Standard-grown samples</th><th>Any residue</th><th>Multiple residues</th><th>Organic samples</th><th>Organic any residue</th></tr></thead><tbody>{food.history.map((record) => <tr key={record.year}><th scope="row"><a href={record.sourceUrl} target="_blank" rel="noreferrer">{record.year} ↗</a><small>{record.period}</small></th><td>{record.conventional.samples}</td><td>{record.conventional.detectedPct}%</td><td>{record.conventional.multiplePct}%</td><td>{record.organic.samples}</td><td>{record.organic.samples >= 5 ? `${record.organic.detectedPct}%` : "Withheld"}</td></tr>)}</tbody></table></div></div>
        </section> : null}

        <ResidueTable food={food} showFoodPageLink={false} showAll />

        <section className="food-explainer">
          <div><p className="eyebrow">What this tells you</p><h2>A monitoring result, not a verdict.</h2></div>
          <div>
            <p>{monitoringContext(food)} It is not a test of every {food.name.toLowerCase()} product sold in {regionLabel(food)}. This entry’s latest included {food.period.toLowerCase()} release is from {food.year}.</p>
            {food.history && food.history.length > 1 ? <p>Comparable annual records are available for {food.history.map((record) => record.year).join(", ")}.</p> : null}
            <p>Published MRLs or tolerances are regulatory limits associated with pesticide use. Consumer-risk assessment is a separate process.</p>
            <p><strong>{coverage.label}.</strong> {coverage.explanation}</p>
            <Link href={`/compare?foods=${food.id}&metric=organic&programme=${food.programmeId ?? "uk-prif"}&region=${food.region}`}>Compare organic and standard-grown results →</Link>
          </div>
        </section>

        <section className="food-faq" aria-labelledby="faq-title"><p className="eyebrow">Common questions</p><h2 id="faq-title">How to read these {food.name.toLowerCase()} results</h2>{questions.map(({ question, answer }) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
      </main>

      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetStructuredData).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData).replace(/</g, "\\u003c") }} />
    </>
  );
}
