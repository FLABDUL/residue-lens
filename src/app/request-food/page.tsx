import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { FoodRequest } from "@/components/FoodRequest";

export const metadata: Metadata = { title: "Request a food | Residue Lens" };
export default function RequestFoodPage() { return <ContentPage eyebrow="Coverage" title="What should we add next?" intro="Search the expanding official-data catalogue first, then ask for a missing item. Requests enter a private product-planning inbox when that service is connected."><FoodRequest /><h2>What can be added?</h2><p>Residue Lens can only publish a comparison when an official sample-level source is available and its commodity can be represented honestly. A request is a priority signal, not a promise that data exists.</p></ContentPage>; }
