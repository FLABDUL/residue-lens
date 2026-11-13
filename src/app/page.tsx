import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { HomeArtwork } from "@/components/HomeArtwork";

export const metadata: Metadata = {
  title: "Compare where buying organic may make the biggest difference | Residue Lens",
  description: "Compare official pesticide-residue monitoring for foods you buy, see sample sizes and source context, then save a personal shortlist.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;

  if (["foods", "metric", "programme", "region"].some((key) => query[key] !== undefined)) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
      else if (value !== undefined) params.set(key, value);
    }
    redirect(`/compare?${params.toString()}`);
  }

  return (
    <>
      <SiteHeader />
      <main className="home-page">
        <section className="home-hero">
          <div className="home-hero-copy">
            <p className="eyebrow">Shop with clearer evidence</p>
            <h1>Compare where buying organic may make the biggest difference.</h1>
            <p className="home-lede">Compare official pesticide-residue results for the foods you actually buy. See the evidence, save a shortlist, then decide where your budget matters.</p>
            <div className="hero-actions">
              <Link className="primary-button" href="/compare">Compare my foods <span aria-hidden="true">→</span></Link>
              <Link className="text-button" href="/guides">How it works</Link>
            </div>
          </div>
          <HomeArtwork />
        </section>
        <section className="home-proof" aria-label="Why use Residue Lens">
          <article><strong>Official evidence</strong><span>UK, US and European monitoring</span></article>
          <article><strong>Personal shortlist</strong><span>Focus on the food you actually buy</span></article>
          <article><strong>Calm context</strong><span>Detection does not automatically mean danger</span></article>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
