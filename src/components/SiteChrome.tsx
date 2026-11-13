"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ResidueLensBrand } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";

type CurrentPage = "compare" | "list" | "guides" | "methodology";

const navigation: Array<{ href: string; label: string; id: CurrentPage }> = [
  { href: "/compare", label: "Compare", id: "compare" },
  { href: "/my-list", label: "My list", id: "list" },
  { href: "/guides", label: "Guides", id: "guides" },
  { href: "/methodology", label: "Methodology", id: "methodology" },
];

function currentPage(pathname: string): CurrentPage | undefined {
  if (pathname.startsWith("/compare")) return "compare";
  if (pathname.startsWith("/my-list")) return "list";
  if (pathname.startsWith("/guides")) return "guides";
  if (pathname.startsWith("/methodology")) return "methodology";
  return undefined;
}

export function SiteHeader({ current }: { current?: CurrentPage } = {}) {
  const pathname = usePathname();
  const active = current ?? currentPage(pathname);

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Residue Lens home">
        <ResidueLensBrand />
      </Link>
      <nav aria-label="Main navigation">
        {navigation.map((item) => (
          <Link key={item.id} href={item.href} aria-current={active === item.id ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
      <ThemeToggle />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <div><strong>Residue Lens</strong><p>Clear evidence for calmer food decisions.</p></div>
      <div className="footer-links">
        <Link href="/about">About</Link><Link href="/methodology">Methodology</Link>
        <Link href="/privacy">Privacy</Link><Link href="/accessibility">Accessibility</Link>
        <Link href="/feedback">Contact us</Link>
        <Link href="/request-food">Request a food</Link>
        <Link href="/support">Support Residue Lens</Link>
        <Link href="/account">Account options</Link>
      </div>
      <div className="footer-source"><span>© {new Date().getFullYear()} Residue Lens. Official-source data; source-specific reuse terms are listed in the methodology.</span><span>Not medical advice.</span></div>
    </footer>
  );
}
