import assert from "node:assert/strict";
import test from "node:test";
import { isSupportPromptExcluded, shouldShowSupportPrompt } from "../src/lib/support-prompt.ts";

test("support prompt becomes eligible one day after dismissal", () => {
  const now = Date.UTC(2026, 9, 17);
  const oneDay = 24 * 60 * 60 * 1000;

  assert.equal(shouldShowSupportPrompt(String(now - oneDay + 1), now), false);
  assert.equal(shouldShowSupportPrompt(String(now - oneDay), now), true);
});

test("support prompt stays off sensitive and support pages", () => {
  for (const path of ["/support", "/privacy", "/feedback", "/account"]) {
    assert.equal(isSupportPromptExcluded(path), true);
  }
  assert.equal(isSupportPromptExcluded("/compare"), false);
});
