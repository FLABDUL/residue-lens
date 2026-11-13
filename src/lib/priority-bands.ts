import type { Metric } from "../data/types";

export type PriorityBand = "lower" | "moderate" | "higher" | "neutral";
export type PriorityResult = { band: PriorityBand; label: string };

type RankedValue = {
  id: string;
  value: number | null | undefined;
};

const inverseMetrics = new Set<Metric>(["residueFreePct"]);

function bandForPosition(position: number, total: number): Exclude<PriorityBand, "neutral"> {
  const proportion = position / total;
  if (proportion < 1 / 3) return "lower";
  if (proportion < 2 / 3) return "moderate";
  return "higher";
}

export function rankPriorityBands(metric: Metric, values: RankedValue[]): Record<string, PriorityBand> {
  const result = Object.fromEntries(values.map(({ id }) => [id, "neutral" as PriorityBand]));
  const published = values.filter(
    (item): item is { id: string; value: number } => typeof item.value === "number" && Number.isFinite(item.value),
  );

  if (published.length === 0) return result;
  if (published.length === 1) {
    result[published[0].id] = "moderate";
    return result;
  }

  const direction = inverseMetrics.has(metric) ? -1 : 1;
  const sorted = [...published].sort((a, b) => direction * (a.value - b.value) || a.id.localeCompare(b.id));

  if (sorted.length === 2 && sorted[0].value !== sorted[1].value) {
    result[sorted[0].id] = "lower";
    result[sorted[1].id] = "higher";
    return result;
  }

  let start = 0;
  while (start < sorted.length) {
    let end = start + 1;
    while (end < sorted.length && sorted[end].value === sorted[start].value) end += 1;
    const band = bandForPosition((start + end) / 2, sorted.length);
    for (let index = start; index < end; index += 1) result[sorted[index].id] = band;
    start = end;
  }

  return result;
}

export function priorityBandForValue(id: string, bands: Record<string, PriorityBand>): PriorityResult {
  const band = bands[id] ?? "neutral";
  const labels: Record<PriorityBand, string> = {
    lower: "Lower organic-buying priority",
    moderate: "Moderate organic-buying priority",
    higher: "Higher organic-buying priority",
    neutral: "Not enough published data",
  };
  return { band, label: labels[band] };
}
