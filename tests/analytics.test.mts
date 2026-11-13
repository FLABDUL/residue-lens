import assert from "node:assert/strict";
import test from "node:test";
import { sanitiseAnalyticsEvent } from "../src/lib/analytics.ts";

test("analytics retains validated campaign attribution and removes comparison details", () => {
  const event = sanitiseAnalyticsEvent({
    type: "pageview",
    url: "https://residuelens.com/compare?foods=grapes%2Cbroccoli%2Cgarlic&metric=detectedPct&utm_source=linkedin&utm_medium=social&utm_campaign=founding_users_oct_2026#results",
  });

  assert.deepEqual(event, {
    type: "pageview",
    url: "https://residuelens.com/compare?utm_source=linkedin&utm_medium=social&utm_campaign=founding_users_oct_2026",
  });
});

test("analytics drops malformed or high-cardinality campaign values", () => {
  const event = sanitiseAnalyticsEvent({
    type: "pageview",
    url: `https://residuelens.com/compare?utm_source=person%40example.com&utm_medium=email&utm_campaign=${"a".repeat(41)}&utm_content=sense_about_science`,
  });

  assert.deepEqual(event, {
    type: "pageview",
    url: "https://residuelens.com/compare?utm_medium=email&utm_content=sense_about_science",
  });
});

test("analytics ignores private account and administration routes", () => {
  for (const url of [
    "https://residuelens.com/account",
    "https://residuelens.com/admin/submissions?email=person%40example.com",
  ]) {
    assert.equal(sanitiseAnalyticsEvent({ type: "pageview", url }), null);
  }
});
