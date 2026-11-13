import type { MetadataRoute } from "next";
import data from "@/data/global-pesticides-latest.json";
import type { Dataset } from "@/data/types";
import { siteUrl } from "@/lib/site";

const dataset = data as Dataset;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["about", "accessibility", "feedback", "guides", "methodology", "privacy", "request-food"];
  return [
    { url: siteUrl, lastModified: new Date("2026-08-30"), changeFrequency: "monthly", priority: 1 },
    ...dataset.foods.map((food) => ({
      url: `${siteUrl}/foods/${food.id}`,
      lastModified: new Date("2026-08-30"),
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
    ...staticRoutes.map((route) => ({ url: `${siteUrl}/${route}`, lastModified: new Date("2026-08-31"), changeFrequency: "monthly" as const, priority: route === "guides" ? 0.8 : 0.6 })),
  ];
}
