import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const isPublicLaunch = process.env.NEXT_PUBLIC_PUBLIC_LAUNCH === "true";
  return {
    rules: isPublicLaunch ? { userAgent: "*", allow: "/" } : { userAgent: "*", disallow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
