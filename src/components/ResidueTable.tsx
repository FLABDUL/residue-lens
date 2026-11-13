import type { FoodRecord } from "@/data/types";
import Link from "next/link";
import { pesticideType } from "@/lib/pesticide-types";
import { ResidueHealthContext } from "@/components/ResidueHealthContext";
import { RESIDUE_TYPE_GUIDE } from "@/lib/residue-types";
import { Fragment } from "react";

function formatConcentration(value: number) {
  return value < 0.01 ? value.toFixed(3) : value.toLocaleString("en-GB", { maximumFractionDigits: 3 });
}

export function ResidueTable({ food, showFoodPageLink = true, showAll = false }: { food: FoodRecord; showFoodPageLink?: boolean; showAll?: boolean }) {
  const visibleResidues = showAll ? food.topResidues : food.topResidues.slice(0, 3);
  return (
    <section className="residue-section" aria-labelledby="residue-title">
      <div className="residue-heading">
        <div>
          <p className="eyebrow">Residue detail</p>
          <h2 id="residue-title">What was found on {food.name.toLowerCase()}?</h2>
          <p>
            The most frequently detected residues across all {food.all.samples} samples. {showAll ? "This is the complete available table for this monitoring entry." : "The three most frequently detected residues are shown here."}
          </p>
          {showFoodPageLink ? <Link className="food-page-link" href={`/foods/${food.id}`}>Open the full {food.name.toLowerCase()} page →</Link> : null}
        </div>
        <div className="sample-summary">
          <strong>{food.all.samples}</strong>
          <span>samples checked</span>
        </div>
      </div>

      {food.topResidues.length > 0 ? <>
        <div className="residue-table-tools">
          <p><strong>Detection does not establish harm.</strong> Health risk depends on both toxicity and the amount a person is exposed to.</p>
          <details className="residue-type-guide">
            <summary>What do these types mean?</summary>
            <ul>{RESIDUE_TYPE_GUIDE.map((item) => <li key={item.type}><span className={`type-tag type-${item.type.toLowerCase().replaceAll(" ", "-").replace("/", "")}`}>{item.type}</span><span>{item.description}</span></li>)}</ul>
            <p>These labels describe agricultural function, not a toxicity ranking.</p>
          </details>
        </div>
        <div
          className="table-scroll"
          role="region"
          tabIndex={0}
          aria-label={`Residue results for ${food.name}`}
        >
          <table>
            <thead>
              <tr>
                <th scope="col">Residue</th>
                <th scope="col">Type</th>
                <th scope="col">Samples</th>
                <th scope="col">Median</th>
                <th scope="col">Higher result</th>
                <th scope="col">Typical published limit</th>
              </tr>
            </thead>
            <tbody>
              {visibleResidues.map((residue) => <Fragment key={residue.name}>
                <tr className="residue-result-row">
                  <th scope="row">{residue.name}</th>
                  <td><span className={`type-tag type-${pesticideType(residue.name).toLowerCase().replaceAll(" ", "-").replace("/", "")}`}>{pesticideType(residue.name)}</span></td>
                  <td>{residue.detections} <small>({residue.samplePct}%)</small></td>
                  <td>{formatConcentration(residue.medianMgKg)} mg/kg</td>
                  <td>{formatConcentration(residue.highMgKg)} mg/kg</td>
                  <td>{residue.typicalMrlMgKg === null ? "Not published" : `${formatConcentration(residue.typicalMrlMgKg)} mg/kg`}</td>
                </tr>
                <tr className="residue-evidence-row">
                  <td colSpan={6}><ResidueHealthContext residue={residue.name} /></td>
                </tr>
              </Fragment>)}
            </tbody>
          </table>
        </div>
      </> : (
        <p className="no-residues">No quantified residues were recorded for this food.</p>
      )}

      <p className="table-note">
        “Higher result” is an approximate 95th-percentile observed concentration, not a safety threshold.
        Amounts of different pesticides should not be added together or compared directly. Functional types
        describe their usual agricultural role; they are not hazard or toxicity rankings.
      </p>
      <p className="health-method-note">ADI and ARfD are intake reference values, not limits for one food sample. A personal assessment would also require consumption, body-weight and wider exposure data. Source programmes report legal Maximum Residue Level results separately.</p>
    </section>
  );
}
