export type ReviewedResidueHealthContext = {
  status: "reviewed";
  authority: "WHO/FAO JMPR";
  assessmentYear: number;
  role: string;
  criticalEffect: string;
  adi: string;
  arfd: string;
  sourceUrl: string;
};

export type ResidueHealthContext = ReviewedResidueHealthContext | {
  status: "unavailable";
  sourceUrl: string;
};

const JMPR_SEARCH = "https://apps.who.int/pesticide-residues-jmpr-database/";

const reviewed: Record<string, ReviewedResidueHealthContext> = {
  imazalil: {
    status: "reviewed",
    authority: "WHO/FAO JMPR",
    assessmentYear: 2018,
    role: "Fungicide, including post-harvest treatment",
    criticalEffect: "Regulatory limits were derived from animal studies that observed changes including body-weight gain, blood chemistry and liver weight at higher doses.",
    adi: "0–0.03 mg/kg body weight per day",
    arfd: "0.05 mg/kg body weight",
    sourceUrl: "https://apps.who.int/pesticide-residues-jmpr-database/pesticide?name=IMAZALIL",
  },
  pyrimethanil: {
    status: "reviewed",
    authority: "WHO/FAO JMPR",
    assessmentYear: 2007,
    role: "Fungicide",
    criticalEffect: "The long-term reference value was based on liver and thyroid changes observed in animal studies at higher doses.",
    adi: "0–0.2 mg/kg body weight per day",
    arfd: "Not considered necessary by JMPR",
    sourceUrl: "https://apps.who.int/pesticide-residues-jmpr-database/pesticide?name=PYRIMETHANIL",
  },
  thiabendazole: {
    status: "reviewed",
    authority: "WHO/FAO JMPR",
    assessmentYear: 2019,
    role: "Fungicide and veterinary anthelmintic",
    criticalEffect: "The long-term guidance value was based on body-weight suppression and nephrosis observed in an animal study at higher doses.",
    adi: "0–0.1 mg/kg body weight per day",
    arfd: "1 mg/kg body weight (general population); 0.3 mg/kg for women of child-bearing age",
    sourceUrl: "https://apps.who.int/pesticide-residues-jmpr-database/pesticide?name=THIABENDAZOLE",
  },
};

export function getResidueHealthContext(name: string): ResidueHealthContext {
  return reviewed[name.trim().toLowerCase()] ?? { status: "unavailable", sourceUrl: JMPR_SEARCH };
}
