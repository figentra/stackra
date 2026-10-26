/**
 * Stackra file contract:
 * Purpose: unit tests of `tierPlan`: a tier's features, limits, modules and seats become plan grants; add-on modules
 *          and extra seats are added; unknown tiers, modules and seat kinds are refused.
 * Boundary: test only; the catalogue is parsed from test rows standing in for a seed record.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0391 (decision 1); ADR 0215.
 */
import { describe, expect, it } from "@stackra/testing";

import { planCatalogueOf } from "#core/functions/plan-catalogue-of.function";
import { tierPlan } from "#core/functions/tier-plan.function";

const catalogue = planCatalogueOf([
  { id: "seat-provider", record: "seat_kind", key: "provider" },
  { id: "module-payroll", record: "module", key: "payroll" },
  { id: "module-clinic", record: "module", key: "clinic" },
  {
    id: "tier-pro",
    record: "tier",
    key: "pro",
    rank: 2,
    features: ["reports"],
    limits: { "tills.device_limit": 10 },
    seats: { provider: 5 },
    modules: ["payroll"],
  },
]);

describe("tierPlan", () => {
  it("grants the tier with add-ons and extra seats", () => {
    expect(tierPlan(catalogue, "pro", ["clinic"], { provider: 2 })).toEqual({
      grants: { reports: true, "tills.device_limit": 10, payroll: true, clinic: true },
      seats: { provider: 7 },
    });
    expect(tierPlan(catalogue, "pro").seats).toEqual({ provider: 5 });
  });

  it("refuses what the catalogue does not hold", () => {
    expect(() => tierPlan(catalogue, "enterprise")).toThrow(/no tier enterprise/);
    expect(() => tierPlan(catalogue, "pro", ["voice"])).toThrow(/module voice/);
    expect(() => tierPlan(catalogue, "pro", [], { support: 1 })).toThrow(/seat kind support/);
  });
});
