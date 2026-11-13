import test from "node:test";
import assert from "node:assert/strict";
import { RESIDUE_TYPE_GUIDE, residueTypeDescription } from "../src/lib/residue-types.ts";

test("explains every functional residue type without ranking its toxicity", () => {
  assert.deepEqual(RESIDUE_TYPE_GUIDE.map((item) => item.type), [
    "Fungicide",
    "Insecticide",
    "Herbicide",
    "Growth regulator",
    "Other / mixed",
  ]);
  assert.match(residueTypeDescription("Fungicide"), /fungal diseases/i);
  assert.match(residueTypeDescription("Insecticide"), /insects/i);
  assert.match(residueTypeDescription("Herbicide"), /weeds/i);
  assert.match(residueTypeDescription("Growth regulator"), /growth|ripening/i);
  assert.match(residueTypeDescription("Other / mixed"), /multiple|not reliably/i);
  assert.ok(RESIDUE_TYPE_GUIDE.every((item) => !/safe|unsafe|harmful|toxic/i.test(item.description)));
});

