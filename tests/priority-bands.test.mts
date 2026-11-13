import test from "node:test";
import assert from "node:assert/strict";
import { priorityBandForValue, rankPriorityBands } from "../src/lib/priority-bands.ts";

test("splits increasing residue values into relative thirds", () => {
  assert.deepEqual(
    rankPriorityBands("detectedPct", [
      { id: "a", value: 10 },
      { id: "b", value: 50 },
      { id: "c", value: 90 },
    ]),
    { a: "lower", b: "moderate", c: "higher" },
  );
});

test("reverses no-residue values", () => {
  assert.deepEqual(
    rankPriorityBands("residueFreePct", [
      { id: "a", value: 10 },
      { id: "b", value: 50 },
      { id: "c", value: 90 },
    ]),
    { a: "higher", b: "moderate", c: "lower" },
  );
});

test("keeps equal values in the same band", () => {
  const bands = rankPriorityBands("detectedPct", [
    { id: "a", value: 20 },
    { id: "b", value: 20 },
    { id: "c", value: 90 },
  ]);
  assert.equal(bands.a, bands.b);
});

test("uses defined one and two item behaviour", () => {
  assert.deepEqual(rankPriorityBands("detectedPct", [{ id: "a", value: 10 }]), { a: "moderate" });
  assert.deepEqual(
    rankPriorityBands("detectedPct", [
      { id: "a", value: 10 },
      { id: "b", value: 20 },
    ]),
    { a: "lower", b: "higher" },
  );
});

test("marks missing values neutral and returns accessible labels", () => {
  const bands = rankPriorityBands("detectedPct", [
    { id: "published", value: 10 },
    { id: "missing", value: null },
  ]);
  assert.equal(bands.missing, "neutral");
  assert.deepEqual(priorityBandForValue("missing", bands), {
    band: "neutral",
    label: "Not enough published data",
  });
  assert.deepEqual(priorityBandForValue("published", bands), {
    band: "moderate",
    label: "Moderate organic-buying priority",
  });
});
