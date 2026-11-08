/**
 * Stackra file contract:
 * Purpose: unit tests of `manifestPackages` and `transitiveRefusals`: os's chain (identity, whose drivers need
 *          config, scope and storage, which need entitlements) refused in one run with paste-ready lines, a cycle
 *          ending, and a package without a resolvable manifest reported as is.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 10).
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { manifestPackages } from "#core/functions/manifest-packages.function";
import { transitiveRefusals } from "#core/functions/transitive-refusals.function";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";

const CODE = "generated_dependency_missing";

/** A manifest whose one driver candidate injects a token from each of `from`. */
function wiring(...from: string[]): StackraManifest {
  return {
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
  } as unknown as StackraManifest;
}

describe("manifestPackages", () => {
  it("lists the @stackra packages drivers wire from, never a subpath or a foreign package", () => {
    expect(manifestPackages(wiring("@stackra/scope/node", "@stackra/config", "zod"))).toEqual([
      "@stackra/config",
      "@stackra/scope",
    ]);
  });
});

describe("transitiveRefusals", () => {
  const ir = {
    ...BILLING_IR,
    packages: ["@stackra/identity"],
    transitiveDependencies: {
      specifier: "catalog:stackra",
      packages: [
        { package: "@stackra/config", requires: [] },
        { package: "@stackra/scope", requires: ["@stackra/entitlements", "@stackra/config"] },
        { package: "@stackra/storage", requires: ["@stackra/entitlements"] },
        { package: "@stackra/entitlements", requires: ["@stackra/scope"] },
      ],
    },
  };

  it("names the whole chain in one run, with every package as a line to paste", () => {
    const errors = transitiveRefusals(
      ir,
      ["@stackra/config", "@stackra/scope", "@stackra/storage"],
      CODE,
    );
    expect(errors.map((error) => error.subject)).toEqual(["@stackra/entitlements", "package.json"]);
    expect(errors.every((error) => error.code === CODE)).toBe(true);
    expect(errors[1]?.fix).toBe(
      [
        "add these to the dependencies in package.json:",
        '"@stackra/config": "catalog:stackra",',
        '"@stackra/entitlements": "catalog:stackra",',
        '"@stackra/scope": "catalog:stackra",',
        '"@stackra/storage": "catalog:stackra",',
      ].join("\n"),
    );
  });

  it("reaches a layer behind a package that is not itself imported, once, even in a cycle", () => {
    const errors = transitiveRefusals(ir, ["@stackra/scope"], CODE);
    expect(errors.map((error) => error.subject)).toEqual([
      "@stackra/config",
      "@stackra/entitlements",
      "package.json",
    ]);
  });

  it("skips a declared package, uses the member's specifier and reports nothing when nothing more is reached", () => {
    const declared = { ...ir, packages: ["@stackra/identity", "@stackra/entitlements"] };
    expect(transitiveRefusals(declared, ["@stackra/storage"], CODE)).toEqual([]);
    const pinned = {
      ...ir,
      transitiveDependencies: { ...ir.transitiveDependencies, specifier: "workspace:*" },
    };
    expect(transitiveRefusals(pinned, ["@stackra/storage"], CODE)[1]?.fix).toContain(
      '"@stackra/storage": "workspace:*",',
    );
    expect(transitiveRefusals(BILLING_IR, ["@stackra/storage"], CODE)).toEqual([]);
  });
});
