export type FunctionalType =
  | "Fungicide"
  | "Growth regulator"
  | "Herbicide"
  | "Insecticide"
  | "Other / mixed";

const TYPES: Record<string, FunctionalType> = {
  acetamiprid: "Insecticide",
  azoxystrobin: "Fungicide",
  bifenthrin: "Insecticide",
  boscalid: "Fungicide",
  "carbendazim (sum)": "Fungicide",
  chlorantraniliprole: "Insecticide",
  chlormequat: "Growth regulator",
  chlorpropham: "Herbicide",
  cyantraniliprole: "Insecticide",
  "cypermethrin (sum)": "Insecticide",
  cyprodinil: "Fungicide",
  deltamethrin: "Insecticide",
  difenoconazole: "Fungicide",
  dithiocarbamates: "Fungicide",
  ethephon: "Growth regulator",
  "flonicamid (sum)": "Insecticide",
  fludioxonil: "Fungicide",
  fluopyram: "Fungicide",
  flupyradifurone: "Insecticide",
  fluxapyroxad: "Fungicide",
  "fosetyl-al (sum)": "Fungicide",
  glyphosate: "Herbicide",
  imazalil: "Fungicide",
  imidacloprid: "Insecticide",
  "lambda-cyhalothrin": "Insecticide",
  "maleic hydrazide": "Growth regulator",
  mepiquat: "Growth regulator",
  methoxyfenozide: "Insecticide",
  metrafenone: "Fungicide",
  myclobutanil: "Fungicide",
  "pirimiphos-methyl": "Insecticide",
  "prochloraz (sum)": "Fungicide",
  "propamocarb (sum)": "Fungicide",
  pyraclostrobin: "Fungicide",
  pyridalyl: "Insecticide",
  pyrimethanil: "Fungicide",
  pyriproxifen: "Insecticide",
  "spirotetramat (partial sum)": "Insecticide",
  "spirotetramat (sum)": "Insecticide",
  sulfoxaflor: "Insecticide",
  tebuconazole: "Fungicide",
  thiabendazole: "Fungicide",
  triallate: "Herbicide",
};

export function pesticideType(name: string): FunctionalType {
  return TYPES[name.toLowerCase()] ?? "Other / mixed";
}
