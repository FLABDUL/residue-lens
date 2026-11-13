import Link from "next/link";
import type { FoodRecord } from "@/data/types";
import { FoodVisual } from "./FoodVisual";

function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

export function OrganicComparisonCard({ food }: { food: FoodRecord }) {
  return (
    <article className="organic-comparison-card">
      <div className="organic-card-food">
        <FoodVisual canonicalId={food.canonicalId} category={food.category} name={food.name} decorative />
        <div><h2>{food.name}</h2><p>{food.year} monitoring</p></div>
      </div>
      <div className="organic-card-bars" aria-label={`Standard-grown and organic residue detection for ${food.name}`}>
        <div>
          <span><strong>Standard-grown</strong><small>{food.conventional.samples} samples</small></span>
          <span className="organic-card-track"><i className="standard" style={{ width: `${food.conventional.detectedPct}%` }} /></span>
          <strong>{formatPercent(food.conventional.detectedPct)}</strong>
        </div>
        <div>
          <span><strong>Organic</strong><small>{food.organic.samples} samples</small></span>
          <span className="organic-card-track"><i className="organic" style={{ width: `${food.organic.detectedPct}%` }} /></span>
          <strong>{formatPercent(food.organic.detectedPct)}</strong>
        </div>
      </div>
      <p className="organic-card-conclusion">Residues were detected less often in the organic samples.</p>
      <Link href={`/foods/${food.id}`}>See the evidence for {food.name.toLowerCase()} →</Link>
    </article>
  );
}
