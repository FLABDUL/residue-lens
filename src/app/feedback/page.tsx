import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { FeedbackForm } from "@/components/FeedbackForm";
export const metadata: Metadata = { title: "Contact us | Residue Lens" };
export default function FeedbackPage() { return <ContentPage eyebrow="Contact us" title="Questions, corrections and useful feedback." intro="Send a note to the private product inbox, or copy it and share it through another channel. The form always tells you whether anything was stored."><FeedbackForm /><h2>What helps us improve</h2><p>Tell us what decision you were trying to make, where the interface slowed you down, and whether you would return when a new annual dataset appears.</p></ContentPage>; }
