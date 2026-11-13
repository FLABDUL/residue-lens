import assert from "node:assert/strict";
import test from "node:test";
import nextConfig from "../next.config.ts";

test("legacy public hosts redirect permanently to the canonical domain", async () => {
  const redirects = await nextConfig.redirects?.();
  assert.ok(redirects);

  for (const host of ["www.residuelens.com", "pesticide-residue-comparison.vercel.app"]) {
    assert.ok(redirects.some((redirect) => redirect.source === "/:path*"
      && redirect.destination === "https://residuelens.com/:path*"
      && redirect.permanent === true
      && redirect.has?.some((condition) => condition.type === "host" && condition.value === host)));
  }
});
