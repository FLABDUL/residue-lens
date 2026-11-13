import type { Metadata } from "next";
import data from "@/data/global-pesticides-latest.json";
import type { Dataset } from "@/data/types";
import { SavedFoodsList } from "@/components/SavedFoodsList";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "My saved food list | Residue Lens", description: "Create a private shortlist of foods and prioritise your organic shopping choices.", robots: { index: false, follow: false } };
const dataset = data as Dataset;

export default function MyListPage() {
  return <><SiteHeader /><main className="saved-page"><header><p className="eyebrow">Private by default</p><h1>My food shortlist</h1><p>Save the foods you actually buy. Household profiles remain on this device unless you explicitly upload them from Account options; export a portable file when you want to move them.</p></header><SavedFoodsList foods={dataset.foods} /></main><SiteFooter /></>;
}
