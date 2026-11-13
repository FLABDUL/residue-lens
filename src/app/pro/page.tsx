import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { InterestSignup } from "@/components/InterestSignup";

export const metadata: Metadata = {
  title: "Plus waitlist | Residue Lens",
  description: "Join the Residue Lens Plus waitlist for occasional updates about a possible future paid plan.",
};

export default function ProPage() {
  return (
    <ContentPage
      eyebrow="Residue Lens Plus"
      title="Join the Plus waitlist."
      intro="Plus is not for sale. Join the waitlist if you would like to hear whether we create an optional paid plan after learning from the free product."
    >
      <section className="waitlist-card" aria-label="Plus waitlist">
        <p>Joining records your interest only. It does not commit you to paying, and no price, features or launch date have been promised.</p>
        <InterestSignup />
      </section>
    </ContentPage>
  );
}
