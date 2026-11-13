import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/ContentPage";
import { OrganicComparisonCard } from "@/components/OrganicComparisonCard";
import data from "@/data/global-pesticides-latest.json";
import type { Dataset } from "@/data/types";

const dataset = data as Dataset;
const priorities = dataset.foods
  .filter((food) => food.region === "GB" && food.organic.samples >= 5)
  .map((food) => ({ food, difference: food.conventional.detectedPct - food.organic.detectedPct }))
  .filter(({ difference }) => difference > 0)
  .toSorted((a, b) => b.difference - a.difference || a.food.name.localeCompare(b.food.name));

export const metadata: Metadata = { title: "Pesticide residue guides | Residue Lens", description: "Plain-English guides to pesticide detections, MRLs, organic comparisons and shopping decisions." };

export default function GuidesPage() {
  return <ContentPage eyebrow="Guides" title="Start with the question you actually have." intro="Short, evidence-led explanations designed to prevent a monitoring number from becoming a health claim.">
    <div className="guide-accordion">
      <details>
        <summary><strong>Where could buying organic make the biggest difference?</strong><span>Compare the foods you buy using sample-aware evidence.</span></summary>
        <div className="guide-answer">
          <p>Standard-grown means food not identified as organic in the source data; the monitoring reports call this conventional.</p>
          <p>Each card compares the latest included Great Britain monitoring results. Larger samples provide a broader snapshot, but detection frequency is not a health-risk score.</p>
          <div className="organic-comparison-grid">
            {priorities.map(({ food }) => <OrganicComparisonCard food={food} key={food.id} />)}
          </div>
          <h2>Use this with your own shopping list</h2>
          <ol>
            <li>Save foods you buy regularly.</li>
            <li>Look for a clear difference supported by useful sample counts.</li>
            <li>Decide where an organic premium matters most to your budget.</li>
            <li>Revisit the choice when a new annual survey is published.</li>
          </ol>
          <p><Link href="/methodology#organic-comparisons">How comparisons qualify →</Link></p>
          <p><Link href="/my-list">Build your private shortlist →</Link></p>
        </div>
      </details>

      <details>
        <summary><strong>What does above an MRL mean?</strong><span>A legal limit, not a toxicity score.</span></summary>
        <div className="guide-answer">
          <p>Maximum residue levels help regulators check whether pesticides have been used correctly. A result above one needs investigation, but does not automatically establish consumer harm.</p>
          <h2>Three different questions</h2>
          <dl>
            <dt>Was a residue detected?</dt><dd>A laboratory measured it above the reporting threshold.</dd>
            <dt>Was the reported result above its MRL?</dt><dd>The measured number exceeded the legal limit printed for that record.</dd>
            <dt>Was there a consumer health risk?</dt><dd>That requires a separate exposure and toxicology assessment by the competent authority.</dd>
          </dl>
          <h2>How Residue Lens labels this</h2>
          <p>Our metric is a numerical parser comparison, not the official non-compliance outcome. We keep that wording beside the result because rounding, measurement uncertainty and regulatory assessment matter.</p>
          <p><a href={dataset.meta.sourcePage} target="_blank" rel="noreferrer">Read the official source material ↗</a></p>
        </div>
      </details>

      <details>
        <summary><strong>Does washing remove pesticide residues?</strong><span>Sensible hygiene, not a residue guarantee.</span></summary>
        <div className="guide-answer">
          <p>Rinsing and preparing produce can reduce dirt and some residues on the surface, but no household method removes every pesticide residue.</p>
          <h2>The useful distinction</h2>
          <p>Some residues are on the surface, while systemic pesticides can be present within the food. Washing or peeling may reduce some residues, but the monitoring results in Residue Lens do not show where each residue sat or how much ordinary preparation removed.</p>
          <p>That is why the app does not label individual foods “removable” or “unremovable”. The source data cannot support that certainty.</p>
          <h2>A practical approach</h2>
          <ul>
            <li>Wash produce under running water before eating or preparing it, including produce you intend to peel.</li>
            <li>Gently rub produce; use a clean produce brush for firm skins where appropriate.</li>
            <li>Peel only when it suits the food and your preference. Peeling also removes edible material and some nutrients.</li>
            <li>Do not use soap, detergent, bleach or household cleaning products on food.</li>
            <li>Do not treat washing as proof that a systemic or absorbed residue is gone.</li>
          </ul>
          <h2>Keep the decision in proportion</h2>
          <p>The monitoring data supports prioritising purchases, not abandoning fruit and vegetables. If a clinician has given you individual dietary advice, follow that advice rather than this general guide.</p>
          <h2>Official guidance</h2>
          <ul>
            <li><a href="https://acss.food.gov.uk/sites/default/files/multimedia/pdfs/publication/foodpestfactsh.pdf" target="_blank" rel="noreferrer">UK Food Standards Agency: pesticides and food</a></li>
            <li><a href="https://www.fda.gov/food/buy-store-serve-safe-food/selecting-and-serving-produce-safely" target="_blank" rel="noreferrer">US Food and Drug Administration: selecting and serving produce safely</a></li>
          </ul>
        </div>
      </details>
    </div>
  </ContentPage>;
}
