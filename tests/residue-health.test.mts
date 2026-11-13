import test from "node:test";
import assert from "node:assert/strict";
import { getResidueHealthContext } from "../src/lib/residue-health.ts";

test("returns reviewed WHO context without treating detection as harm", () => {
  const imazalil = getResidueHealthContext(" IMAZALIL ");
  assert.equal(imazalil.status, "reviewed");
  if (imazalil.status !== "reviewed") return;
  assert.equal(imazalil.authority, "WHO/FAO JMPR");
  assert.equal(imazalil.assessmentYear, 2018);
  assert.equal(imazalil.adi, "0–0.03 mg/kg body weight per day");
  assert.equal(imazalil.arfd, "0.05 mg/kg body weight");
  assert.match(imazalil.sourceUrl, /^https:\/\/apps\.who\.int\/pesticide-residues-jmpr-database\//);
  assert.doesNotMatch(imazalil.criticalEffect, /this detection (causes|harms|damages)/i);
});

test("keeps a pesticide with no acute reference dose explicit", () => {
  const context = getResidueHealthContext("pyrimethanil");
  assert.equal(context.status, "reviewed");
  if (context.status !== "reviewed") return;
  assert.equal(context.arfd, "Not considered necessary by JMPR");
  assert.match(context.criticalEffect, /liver and thyroid/i);
});

test("includes the third leading lemon residue from its latest JMPR review", () => {
  const context = getResidueHealthContext("thiabendazole");
  assert.equal(context.status, "reviewed");
  if (context.status !== "reviewed") return;
  assert.equal(context.assessmentYear, 2019);
  assert.match(context.criticalEffect, /body-weight suppression and nephrosis/i);
  assert.equal(context.adi, "0–0.1 mg/kg body weight per day");
  assert.equal(context.arfd, "1 mg/kg body weight (general population); 0.3 mg/kg for women of child-bearing age");
});

test("unknown residue has an honest unavailable state", () => {
  assert.deepEqual(getResidueHealthContext("not-a-reviewed-substance"), {
    status: "unavailable",
    sourceUrl: "https://apps.who.int/pesticide-residues-jmpr-database/",
  });
});
