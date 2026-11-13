import Link from "next/link";
import type { Dataset } from "@/data/types";

export function DecisionGuides({ current }: { current: Dataset }) {
  const organicPriorities = current.foods
    .filter((food) => food.region === "GB" && food.organic.samples >= 5)
    .map((food) => ({
      ...food,
      difference: Math.max(0, food.conventional.detectedPct - food.organic.detectedPct),
    }))
    .sort((a, b) => b.difference - a.difference)
    .slice(0, 4);

  const historicalRows = current.foods.filter((food) => food.region === "GB").flatMap((food) => {
    const [latest, prior] = food.history ?? [];
    return latest && prior ? [{ current: food, latest, prior }] : [];
  }).toSorted((a, b) => b.latest.year - a.latest.year || a.current.name.localeCompare(b.current.name)).slice(0, 8);

  return (
    <section className="decision-guides" id="guides" aria-labelledby="guides-title">
      <div className="section-intro">
        <p className="eyebrow">Decision guides</p>
        <h2 id="guides-title">More useful than a single “dirty” list.</h2>
        <p>See where the organic comparison is most pronounced, and where annual results are broadly stable or change.</p>
      </div>

      <div className="guide-grid">
        <article className="guide-card priority-card">
          <header>
            <p className="eyebrow">Organic may matter most</p>
            <h3>Largest detection-frequency gaps</h3>
          </header>
          <ol className="priority-list">
            {organicPriorities.map((food) => (
              <li key={food.id}>
                <Link href={`/foods/${food.id}`}>
                  <span className="rank-name">{food.name}</span>
                  <span className="rank-bar" aria-hidden="true"><i style={{ width: `${food.difference}%` }} /></span>
                  <strong>{food.difference.toFixed(1)} <small>points</small></strong>
                </Link>
                <p>{food.conventional.detectedPct}% conventional · {food.organic.detectedPct}% organic ({food.organic.samples} samples)</p>
              </li>
            ))}
          </ol>
          <p className="guide-note">This compares detection frequency, not health risk. Organic results are shown only with at least five samples.</p>
        </article>

        <article className="guide-card history-card">
          <header>
            <p className="eyebrow">Year-to-year context</p>
            <h3>Foods with more than one survey release</h3>
          </header>
          <div className="history-list" role="region" aria-label="Conventional samples with a detected residue by year">
            <div className="history-head">
              <span>Food</span><span>Prior</span><span>Latest</span><span>Change</span>
            </div>
            {historicalRows.map(({ current: food, latest, prior }) => {
              const change = latest.conventional.detectedPct - prior.conventional.detectedPct;
              return (
                <Link href={`/foods/${food.id}`} className="history-row" key={food.id}>
                  <strong>{food.name}</strong>
                  <span>{prior.year}: {prior.conventional.detectedPct}%</span>
                  <span>{latest.year}: {latest.conventional.detectedPct}%</span>
                  <span className={change > 0 ? "up" : "down"}>{change > 0 ? "+" : ""}{change.toFixed(1)}</span>
                </Link>
              );
            })}
          </div>
          <p className="guide-note">Samples differ in origin and season. Changes provide context, not proof of a trend.</p>
        </article>
      </div>
    </section>
  );
}
