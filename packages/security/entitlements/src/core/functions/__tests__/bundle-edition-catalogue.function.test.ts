/**
 * Stackra file contract:
 * Purpose: unit tests of `bundleEditionCatalogue`: bundled base modules are sold by the edition and included by every
 *          tier, a tier's own bundle only by that tier, `tierPlan` grants them, an unbundled base module is never
 *          granted, and a module the base does not sell or an unknown tier is a `RangeError`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0335 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { bundleEditionCatalogue } from "#core/functions/bundle-edition-catalogue.function";
import { tierPlan } from "#core/functions/tier-plan.function";
import type { PlanCatalogue } from "#core/types/plan-catalogue.type";

/** A catalogue with `tiers` (no limits or seats) selling `modules`. */
function catalogue(tiers: readonly string[], modules: readonly string[]): PlanCatalogue {
  return {
    tiers: tiers.map((key, rank) => ({
      key,
      rank,
      features: [],
      limits: {},
      seats: {},
      modules: [],
    })),
    seatKinds: [],
    modules: modules.map((key) => ({ key })),
    trials: [],
    extras: {},
  };
}

const commerce = catalogue(["starter"], ["catalog", "orders", "wholesale"]);
const fashion = catalogue(["starter", "pro"], ["fashion_sizes"]);

describe("bundleEditionCatalogue", () => {
  const bundled = bundleEditionCatalogue(
    fashion,
    { of: "commerce", modules: ["catalog"], tiers: { pro: ["orders"] } },
    commerce,
  );

  it("sells the bundled base modules and includes them per tier", () => {
    expect(bundled.modules.map((module) => module.key)).toEqual([
      "fashion_sizes",
      "catalog",
      "orders",
    ]);
    expect(bundled.tiers.map((tier) => tier.modules)).toEqual([["catalog"], ["catalog", "orders"]]);
    expect(fashion.tiers[0]?.modules).toEqual([]);
  });

  it("grants bundled modules and never an unbundled base module", () => {
    expect(tierPlan(bundled, "pro").grants).toEqual({ catalog: true, orders: true });
    expect(() => tierPlan(bundled, "starter", ["wholesale"])).toThrow(RangeError);
  });

  it("refuses a module the base does not sell and an unknown tier", () => {
    expect(() =>
      bundleEditionCatalogue(fashion, { of: "commerce", modules: ["returns"] }, commerce),
    ).toThrow(RangeError);
    expect(() =>
      bundleEditionCatalogue(
        fashion,
        { of: "commerce", modules: [], tiers: { gold: [] } },
        commerce,
      ),
    ).toThrow(RangeError);
  });
});
