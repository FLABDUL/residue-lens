import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/ContentPage";
import { SupportLink } from "@/components/SupportLink";
import { validSupportUrl } from "@/lib/support";

export const metadata: Metadata = {
  title: "Support Residue Lens",
  description: "Help sustain Residue Lens while its evidence and editorial decisions remain independent.",
};

export default function SupportPage() {
  const supportUrl = validSupportUrl(process.env.NEXT_PUBLIC_SUPPORT_URL);
  return <ContentPage eyebrow="Support the project" title="Help keep Residue Lens useful and independent." intro="Residue Lens is a small public-interest project. If it has helped you make sense of official monitoring data, you can support the work without changing what the evidence says.">
    <section className="support-panel">
      <h2>What support funds</h2>
      <ul>
        <li>Hosting, the domain and essential product services.</li>
        <li>Maintaining data importers when official publications change.</li>
        <li>Testing accessibility, browsers and mobile layouts.</li>
        <li>Time spent checking corrections and improving explanations.</li>
      </ul>
      {supportUrl ? <SupportLink href={supportUrl} className="primary-link">Buy me a coffee ↗</SupportLink> : <p><strong>The contribution link is being prepared.</strong> The free product remains available in full.</p>}
    </section>
    <h2>What support cannot influence</h2>
    <p>Contributions do not buy a better ranking, change a comparison, suppress an inconvenient result or determine an editorial conclusion. Official-source evidence and the published methodology remain the basis for every result.</p>
    <h2>Other useful ways to help</h2>
    <p>You can share Residue Lens with someone who would use it, report a confusing explanation or incorrect result, and suggest a food that is present in an official source but missing from the catalogue.</p>
    <p><Link href="/feedback">Send feedback or a correction →</Link></p>
    <p><Link href="/request-food">Request a food →</Link></p>
  </ContentPage>;
}
