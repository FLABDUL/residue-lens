import type { FoodRecord, SampleMetrics } from "@/data/types";

export type CoverageLevel = "limited" | "moderate" | "broader";

export function coverageLevel(samples: number): CoverageLevel {
  if (samples < 20) return "limited";
  if (samples < 50) return "moderate";
  return "broader";
}

export function coverageLabel(samples: number) {
  const level = coverageLevel(samples);
  return {
    level,
    label: `${level[0].toUpperCase()}${level.slice(1)} sample coverage`,
    explanation:
      level === "limited"
        ? "Fewer than 20 samples: useful as a monitoring snapshot, but sensitive to individual results."
        : level === "moderate"
          ? "20–49 samples: a useful monitoring snapshot, though not a population estimate."
          : "At least 50 samples: broader monitoring coverage, but still targeted rather than random.",
  };
}

export function organicComparable(food: FoodRecord) {
  return food.organic.samples >= 5;
}

export function countFromRate(metrics: SampleMetrics, key: "detectedPct" | "multiplePct" | "aboveMrlPct") {
  return Math.round((metrics[key] / 100) * metrics.samples);
}
