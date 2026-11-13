import assert from "node:assert/strict";
import test from "node:test";

import {
  assertDatabaseTarget,
  databaseNameFromUrl,
} from "../src/lib/database-target.mjs";

const developmentUrl = "postgresql://example.test/residue_lens_dev?sslmode=require";
const productionUrl = "postgresql://example.test/neondb?sslmode=require";

test("extracts the database name without exposing credentials", () => {
  assert.equal(databaseNameFromUrl(developmentUrl), "residue_lens_dev");
});

test("accepts the isolated database in Preview and Development", () => {
  assert.doesNotThrow(() => assertDatabaseTarget(developmentUrl, "preview"));
  assert.doesNotThrow(() => assertDatabaseTarget(developmentUrl, "development"));
});

test("accepts the beta database only in Production", () => {
  assert.doesNotThrow(() => assertDatabaseTarget(productionUrl, "production"));
});

test("blocks Preview and Development from the beta database", () => {
  assert.throws(
    () => assertDatabaseTarget(productionUrl, "preview"),
    /expected “residue_lens_dev”, received “neondb”/,
  );
  assert.throws(
    () => assertDatabaseTarget(productionUrl, "development"),
    /expected “residue_lens_dev”, received “neondb”/,
  );
});

test("blocks Production from the isolated development database", () => {
  assert.throws(
    () => assertDatabaseTarget(developmentUrl, "production"),
    /expected “neondb”, received “residue_lens_dev”/,
  );
});

test("allows non-Vercel tools and CI builds to opt out", () => {
  assert.doesNotThrow(() => assertDatabaseTarget(developmentUrl, undefined));
});

test("fails closed for unknown environments and malformed URLs", () => {
  assert.throws(() => assertDatabaseTarget(developmentUrl, "staging"), /unknown Vercel environment/);
  assert.throws(() => databaseNameFromUrl("not a URL"), /not a valid URL/);
});
