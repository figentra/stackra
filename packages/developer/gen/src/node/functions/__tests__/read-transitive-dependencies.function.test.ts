/**
 * Stackra file contract:
 * Purpose: unit tests of `readTransitiveDependencies`: os's chain (identity, then config, scope and storage, then
 *          entitlements) found from stub manifests, each package resolved from the folder of the one that brought it
 *          in (nested `node_modules`, as pnpm lays them out), a declared package skipped, a cycle ended and a package
 *          that cannot be resolved listed without descending.
 * Boundary: test only; writes small fixtures under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 25).
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { readTransitiveDependencies } from "#node/functions/read-transitive-dependencies.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

/** A manifest whose one driver candidate injects a token from each package in `from`. */
function wiring(...from: string[]): string {
  return JSON.stringify({
    drivers: [
      {
        key: "x",
        classes: {
          a: {
            class: "A",
            from: "@stackra/x",
            deps: from.map((f) => ({ class: { name: "T", from: f } })),
          },
        },
      },
    ],
  });
}

const identity = JSON.parse(
  wiring("@stackra/config", "@stackra/scope", "@stackra/storage"),
) as StackraManifest;
const ghost = JSON.parse(wiring("@stackra/config", "@stackra/ghost-zz")) as StackraManifest;
const BASE = "node_modules/@stackra/identity";

describe("readTransitiveDependencies", () => {
  it("follows the chain through the packages that bring each in, once each, and stops at a cycle", () => {
    const root = writeFixtureMember("os", {
      [`${BASE}/package.json`]: JSON.stringify({ name: "@stackra/identity" }),
      [`${BASE}/node_modules/@stackra/config/package.json`]: "{}",
      [`${BASE}/node_modules/@stackra/config/stackra.manifest.json`]: "{}",
      [`${BASE}/node_modules/@stackra/scope/package.json`]: "{}",
      [`${BASE}/node_modules/@stackra/scope/stackra.manifest.json`]:
        wiring("@stackra/entitlements"),
      [`${BASE}/node_modules/@stackra/scope/node_modules/@stackra/entitlements/package.json`]: "{}",
      [`${BASE}/node_modules/@stackra/scope/node_modules/@stackra/entitlements/stackra.manifest.json`]:
        wiring("@stackra/scope"),
      [`${BASE}/node_modules/@stackra/storage/package.json`]: "{}",
      [`${BASE}/node_modules/@stackra/storage/stackra.manifest.json`]:
        wiring("@stackra/entitlements"),
    });
    const found = readTransitiveDependencies(
      root,
      [{ package: "@stackra/identity", manifest: identity }],
      ["@stackra/identity"],
    );
    expect(found).toEqual([
      { package: "@stackra/config", requires: [] },
      { package: "@stackra/scope", requires: ["@stackra/entitlements"] },
      { package: "@stackra/storage", requires: ["@stackra/entitlements"] },
      { package: "@stackra/entitlements", requires: ["@stackra/scope"] },
    ]);
  });

  it("skips a declared package and lists an unresolvable one without descending", () => {
    const root = writeFixtureMember("os-declared", {
      [`${BASE}/package.json`]: JSON.stringify({ name: "@stackra/identity" }),
    });
    expect(
      readTransitiveDependencies(
        root,
        [{ package: "@stackra/identity", manifest: ghost }],
        ["@stackra/identity", "@stackra/config"],
      ),
    ).toEqual([{ package: "@stackra/ghost-zz", requires: [] }]);
  });
});
