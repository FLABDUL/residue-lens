import data from "@/data/global-pesticides-latest.json";
import type { Dataset, Metric } from "@/data/types";
import { PesticideExplorer } from "@/components/PesticideExplorer";

const dataset = data as Dataset;
const defaultFoods = ["grapes", "broccoli", "garlic"];
const validMetrics: Metric[] = ["detectedPct", "residueFreePct", "multiplePct", "aboveMrlPct", "medianResidues", "organic"];

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ foods?: string; metric?: string; programme?: string; region?: string }>;
}) {
  const query = await searchParams;
  const validFoodIds = new Set(dataset.foods.map((food) => food.id));
  const requestedFoods = query.foods
    ?.split(",")
    .filter((id) => validFoodIds.has(id))
    .slice(0, 7);
  const initialMetric = validMetrics.includes(query.metric as Metric)
    ? (query.metric as Metric)
    : "detectedPct";
  const requestedRecords = dataset.foods.filter((food) => requestedFoods?.includes(food.id));
  const initialProgramme = dataset.meta.programmes?.some((programme) => programme.id === query.programme)
    ? query.programme!
    : requestedRecords[0]?.programmeId ?? "uk-prif";
  const programmeRecords = dataset.foods.filter((food) => food.programmeId === initialProgramme);
  const validProgrammeRegions = new Set(programmeRecords.map((food) => food.region));
  const initialRegion = initialProgramme === "uk-prif" && ["GB", "NI", "all"].includes(query.region ?? "")
    ? query.region!
    : initialProgramme === "uk-prif" ? requestedRecords[0]?.region ?? "GB"
      : initialProgramme === "efsa-controls" ? (validProgrammeRegions.has(query.region ?? "") ? query.region! : requestedRecords[0]?.region ?? programmeRecords.toSorted((a, b) => (a.market ?? "").localeCompare(b.market ?? ""))[0]?.region ?? "all")
        : "all";
  const initialFoodIds = requestedFoods?.length
    ? requestedFoods
    : initialProgramme === "uk-prif"
      ? defaultFoods
      : programmeRecords.filter((food) => initialRegion === "all" || food.region === initialRegion).slice(0, 5).map((food) => food.id);

  return (
    <PesticideExplorer
      dataset={dataset}
      initialMetric={initialMetric}
      initialSelectedIds={initialFoodIds}
      initialProgramme={initialProgramme}
      initialRegion={initialRegion}
      initialIsExample={!requestedFoods?.length}
    />
  );
}
