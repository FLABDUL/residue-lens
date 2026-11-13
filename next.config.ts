import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  allowedDevOrigins: ["127.0.0.1"],
  redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.residuelens.com" }],
        destination: "https://residuelens.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "pesticide-residue-comparison.vercel.app" }],
        destination: "https://residuelens.com/:path*",
        permanent: true,
      },
      { source: "/beta", destination: "/feedback", permanent: true },
      { source: "/guides/organic-priorities", destination: "/guides", permanent: true },
      { source: "/guides/understanding-mrls", destination: "/guides", permanent: true },
      { source: "/guides/washing-and-peeling", destination: "/guides", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
