import type { Metadata } from "next";
import data from "@/data/global-pesticides-latest.json";
import type { Dataset } from "@/data/types";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { OrganicBudgetPlanner } from "@/components/OrganicBudgetPlanner";

export const metadata: Metadata = { title: "Organic budget planner | Residue Lens", description: "Plan where a limited organic-food budget may make the largest observed difference for your saved foods.", robots: { index: false, follow: false } };

export default function PlannerPage() {
  const dataset = data as Dataset;
  return <><SiteHeader /><main className="saved-page planner-page"><header><p className="eyebrow">Unlisted research preview</p><h1>Make your organic budget practical.</h1><p>This early tool turns your current browser list into a transparent monthly allocation. It remains outside the main navigation while we test whether it solves a recurring problem.</p></header><OrganicBudgetPlanner foods={dataset.foods} /></main><SiteFooter /></>;
}
