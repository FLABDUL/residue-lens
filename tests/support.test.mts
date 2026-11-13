import assert from "node:assert/strict";
import test from "node:test";
import { validSupportUrl } from "../src/lib/support.ts";

test("accepts an HTTPS contribution URL", () => {
  assert.equal(validSupportUrl("https://buymeacoffee.com/example"), "https://buymeacoffee.com/example");
});

test("rejects missing, insecure and executable URLs", () => {
  assert.equal(validSupportUrl(undefined), null);
  assert.equal(validSupportUrl("http://example.com"), null);
  assert.equal(validSupportUrl("javascript:alert(1)"), null);
  assert.equal(validSupportUrl("not a URL"), null);
});
