import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export function ContentPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return <><SiteHeader /><main className="content-page"><header><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{intro}</p></header><div className="prose">{children}</div></main><SiteFooter /></>;
}
