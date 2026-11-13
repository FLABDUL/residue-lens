import type { FoodRecord, Metric } from "@/data/types";
import { FoodVisual } from "./FoodVisual";
import { PriorityLegend } from "./PriorityLegend";
import { priorityBandForValue, rankPriorityBands } from "@/lib/priority-bands";

type ComparisonChartProps = {
  foods: FoodRecord[];
  referenceFoods: FoodRecord[];
  metric: Metric;
  focusedFoodId: string;
  onFocus: (foodId: string) => void;
};

const METRIC_COPY: Record<
  Exclude<Metric, "organic">,
  { title: string; description: string }
> = {
  detectedPct: {
    title: "Samples with residues detected",
    description:
      "Share of standard-grown samples with at least one quantified residue.",
  },
  residueFreePct: {
    title: "Samples with no quantified residue",
    description: "Share of standard-grown samples where all reported results were below the programme’s quantification threshold.",
  },
  multiplePct: {
    title: "Samples with multiple residues",
    description:
      "Share of standard-grown samples with two or more quantified residues.",
  },
  aboveMrlPct: {
    title: "Samples above a published limit",
    description:
      "Share of standard-grown samples flagged above a source-programme MRL or tolerance. This is a compliance measure, not a toxicity score.",
  },
  medianResidues: {
    title: "Typical residue count per sample",
    description: "Median number of quantified residues recorded on each standard-grown sample. Chemicals and concentrations are not added together.",
  },
};

function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function valueBarStyle(value: number, maximum: number) {
  const width = maximum ? Math.min(100, value / maximum * 100) : 0;
  return { width: `${width}%` };
}

function formatValue(value: number, metric: Metric) {
  return metric === "medianResidues" ? value.toLocaleString("en-GB", { maximumFractionDigits: 1 }) : formatPercent(value);
}

export function ComparisonChart({
  foods,
  referenceFoods,
  metric,
  focusedFoodId,
  onFocus,
}: ComparisonChartProps) {
  if (foods.length === 0) {
    return (
      <div className="empty-state">
        <span aria-hidden="true">↖</span>
        <h3>Select at least one food</h3>
        <p>Your comparison will appear here.</p>
      </div>
    );
  }

  if (metric === "organic") {
    const organicBands = rankPriorityBands("organic", referenceFoods.map((food) => ({
      id: food.id,
      value: food.organic.samples >= 5 ? Math.max(0, food.conventional.detectedPct - food.organic.detectedPct) : null,
    })));
    const ordered = foods.toSorted(
      (a, b) => b.conventional.detectedPct - a.conventional.detectedPct,
    );

    return (
      <section aria-labelledby="chart-title">
        <div className="chart-heading">
          <div>
            <p className="eyebrow">Organic comparison</p>
            <h2 id="chart-title">Does organic change detection frequency?</h2>
            <p>
              Standard-grown and organic samples are shown separately. Comparisons
              with fewer than five organic samples are withheld.
            </p>
          </div>
          <div className="legend" aria-label="Chart legend">
            <span><i className="legend-swatch conventional" />Standard-grown</span>
            <span><i className="legend-swatch organic" />Organic</span>
          </div>
        </div>

        <div className="organic-chart">
          {ordered.map((food) => {
            const enoughOrganic = food.organic.samples >= 5;
            const priority = priorityBandForValue(food.id, organicBands);
            return (
              <button
                className={`organic-row ${focusedFoodId === food.id ? "focused" : ""}`}
                key={food.id}
                onClick={() => onFocus(food.id)}
                type="button"
                aria-label={`Show residue details for ${food.name}`}
              >
                <div className="organic-row-label">
                  <span><FoodVisual canonicalId={food.canonicalId} category={food.category} name={food.name} decorative /><strong>{food.name}</strong></span>
                  <span>{food.market ?? food.region} · {food.conventional.samples} standard-grown samples · {food.year}</span>
                  <span className="priority-chip" data-priority={priority.band}>{priority.label}</span>
                </div>
                <div className="paired-bars">
                  <div className="bar-line">
                    <span className="bar-kind">C</span>
                    <div className="bar-track">
                      <span
                        className="bar-fill conventional"
                        style={{ width: `${food.conventional.detectedPct}%` }}
                      />
                    </div>
                    <strong>{formatPercent(food.conventional.detectedPct)}</strong>
                  </div>
                  {enoughOrganic ? (
                    <div className="bar-line">
                      <span className="bar-kind">O</span>
                      <div className="bar-track">
                        <span
                          className="bar-fill organic"
                          style={{ width: `${food.organic.detectedPct}%` }}
                        />
                      </div>
                      <strong>{formatPercent(food.organic.detectedPct)}</strong>
                    </div>
                  ) : (
                    <div className="insufficient">
                      Only {food.organic.samples} organic sample
                      {food.organic.samples === 1 ? "" : "s"}, so this is not compared
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <PriorityLegend />
      </section>
    );
  }

  const copy = METRIC_COPY[metric];
  const bands = rankPriorityBands(metric, referenceFoods.map((food) => ({
    id: food.id,
    value: food.conventional.samples > 0 ? food.conventional[metric] : null,
  })));
  const maximum = metric === "medianResidues" ? Math.max(1, ...foods.map((food) => food.conventional.medianResidues)) : 100;
  const ordered = foods.toSorted(
    (a, b) => b.conventional[metric] - a.conventional[metric],
  );

  return (
    <section aria-labelledby="chart-title">
      <div className="chart-heading">
        <div>
          <p className="eyebrow">Standard-grown food</p>
          <h2 id="chart-title">{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
        <div className="chart-scale" aria-hidden="true">
          <span>0</span><span>{metric === "medianResidues" ? (maximum / 2).toFixed(1) : "50%"}</span><span>{metric === "medianResidues" ? maximum.toFixed(1) : "100%"}</span>
        </div>
      </div>

      <div className="bar-chart" role="region" aria-label={copy.title}>
        {ordered.map((food) => {
          const value = food.conventional[metric];
          const priority = priorityBandForValue(food.id, bands);
          return (
            <button
              className={`chart-row ${focusedFoodId === food.id ? "focused" : ""}`}
              key={food.id}
              onClick={() => onFocus(food.id)}
              type="button"
              aria-label={`${food.name}: ${formatValue(value, metric)}${metric === "medianResidues" ? " median residues per sample" : ""}, based on ${food.conventional.samples} standard-grown samples. ${priority.label}. Show residue details.`}
            >
              <span className="chart-label">
                <span><FoodVisual canonicalId={food.canonicalId} category={food.category} name={food.name} decorative /><strong>{food.name}</strong></span>
                <small>{food.market ?? food.region} · {food.year} · n={food.conventional.samples}</small>
              </span>
              <span className="bar-track">
                <span
                  className={`bar-fill metric-${metric}`}
                  data-priority={priority.band}
                  style={valueBarStyle(value, maximum)}
                />
              </span>
              <span className="bar-value"><strong>{formatValue(value, metric)}</strong><small>{priority.label}</small></span>
            </button>
          );
        })}
      </div>
      <PriorityLegend />
    </section>
  );
}
