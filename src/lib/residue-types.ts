import type { FunctionalType } from "@/lib/pesticide-types";

export const RESIDUE_TYPE_GUIDE: ReadonlyArray<{ type: FunctionalType; description: string }> = [
  { type: "Fungicide", description: "Controls fungal diseases such as moulds and mildews." },
  { type: "Insecticide", description: "Controls insects that damage crops or stored food." },
  { type: "Herbicide", description: "Controls weeds competing with a crop." },
  { type: "Growth regulator", description: "Changes plant growth, development or ripening." },
  { type: "Other / mixed", description: "Covers multiple substances or a role that cannot be reliably assigned from the published name." },
] as const;

export function residueTypeDescription(type: FunctionalType): string {
  return RESIDUE_TYPE_GUIDE.find((item) => item.type === type)?.description ?? RESIDUE_TYPE_GUIDE.at(-1)!.description;
}

