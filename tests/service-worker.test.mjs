import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

test("retirement activation removes every Residue Lens cache and unregisters itself", async () => {
  const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  const handlers = new Map();
  const deleted = [];
  let claimed = false;
  let unregistered = false;

  const context = {
    caches: {
      keys: async () => ["residue-lens-v3", "residue-lens-v4", "unrelated-cache"],
      delete: async (key) => { deleted.push(key); return true; },
    },
    fetch: async () => { throw new Error("fetch is not used during activation"); },
    self: {
      addEventListener: (name, handler) => handlers.set(name, handler),
      clients: { claim: () => { claimed = true; } },
      location: { origin: "https://example.test" },
      registration: { unregister: async () => { unregistered = true; return true; } },
      skipWaiting: () => undefined,
    },
  };

  vm.runInNewContext(source, context);
  let activation;
  handlers.get("activate")({ waitUntil: (promise) => { activation = promise; } });
  await activation;

  assert.deepEqual(deleted, ["residue-lens-v3", "residue-lens-v4"]);
  assert.equal(claimed, true);
  assert.equal(unregistered, true);
  assert.equal(handlers.has("fetch"), false);
});
