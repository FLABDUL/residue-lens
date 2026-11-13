import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContentPage } from "@/components/ContentPage";

export const metadata: Metadata = { title: "About Residue Lens", description: "Why Residue Lens exists and the editorial principles behind it." };

export default function AboutPage() {
  return <ContentPage eyebrow="About the project" title="Evidence for a calmer shopping decision." intro="Residue Lens turns difficult public monitoring data into comparisons ordinary shoppers can interrogate.">
    <section className="founder-card"><Image className="founder-photo" src="/founder-hakim.jpg" width={176} height={176} sizes="88px" alt="Abdul Hakim Norazman" priority /><div><p className="eyebrow">Built by</p><h2>Abdul Hakim Norazman</h2><p>Hakim is a UK-based engineer and data-minded maker. He began Residue Lens after trying to make a practical household shopping list for reducing pesticide residues without turning food into a frightening “dirty” ranking.</p><p><a href="https://www.madebyhakim.com" target="_blank" rel="noreferrer">madebyhakim.com ↗</a></p></div></section>
    <h2>What problem are we solving?</h2><p>Pesticide conversations often collapse into alarming lists or broad reassurance. Neither helps someone deciding where a limited organic-food budget may make the most practical difference.</p>
    <h2>Editorial principles</h2><ul><li>Detection is never presented as proof of harm.</li><li>Sample counts and limitations travel with the numbers.</li><li>Official data and processing methods remain traceable.</li><li>Commercial relationships will never alter rankings or editorial conclusions.</li><li>Corrections are recorded openly.</li></ul>
    <h2>Who is it for?</h2><p>People who want to reduce dietary pesticide residues without being told to avoid fruit and vegetables. The tool is educational, not medical advice.</p>
    <h2>How it was made</h2><p>Hakim directs the product and editorial choices. Official HSE and Defra workbooks are parsed by reproducible code, with automated checks and human review of terminology. AI-assisted development has been used to help research, design and implement the tool; it is not used to invent monitoring results or health conclusions.</p>
    <p><Link href="/methodology">Read the full methodology →</Link></p>
  </ContentPage>;
}
