export type SampleMetrics = {
  samples: number;
  detectedPct: number;
  residueFreePct: number;
  multiplePct: number;
  aboveMrlPct: number;
  medianResidues: number;
  maxResidues: number;
};

export type ResidueSummary = {
  name: string;
  detections: number;
  samplePct: number;
  medianMgKg: number;
  highMgKg: number;
  typicalMrlMgKg: number | null;
};

export type FoodRecord = {
  id: string;
  canonicalId: string;
  name: string;
  category: string;
  region: string;
  market?: string;
  programmeId?: string;
  programme?: string;
  year: number;
  period: string;
  sourceUrl: string;
  limitBasis?: string;
  all: SampleMetrics;
  conventional: SampleMetrics;
  organic: SampleMetrics;
  topResidues: ResidueSummary[];
  origin?: {
    domesticSamples: number;
    importedSamples: number;
    unknownSamples: number;
    topCountries: Array<{ country: string; samples: number }>;
  };
  history?: Array<{
    year: number;
    period: string;
    sourceUrl: string;
    all: SampleMetrics;
    conventional: SampleMetrics;
    organic: SampleMetrics;
  }>;
};

export type Dataset = {
  meta: {
    title: string;
    year: number;
    years?: number[];
    region: string;
    sourceUrl: string;
    sourcePage: string;
    licence: string;
    generatedNote: string;
    programmes?: Array<{ id: string; name: string; market: string; sourceUrl: string }>;
  };
  foods: FoodRecord[];
};

export type Metric =
  | "detectedPct"
  | "residueFreePct"
  | "multiplePct"
  | "aboveMrlPct"
  | "medianResidues"
  | "organic";
