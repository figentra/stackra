/**
 * Stackra file contract:
 * Purpose: unit tests of `planCatalogueOf`: seat kinds, modules, tiers (sorted by rank, `null` limits unlimited) and
 *          trials are read from rows; malformed rows, duplicates and unknown references are refused by row id.
 * Boundary: test only; the rows stand in for a `plan-catalogue:<product>` seed record.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0391 (decisions 1 and 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { planCatalogueOf } from "#core/functions/plan-catalogue-of.function";

const CATALOGUE_ROWS = [
  { id: "seat-full", answer: "XP-1", record: "seat_kind", key: "full" },
  { id: "seat-provider", answer: "XP-1", record: "seat_kind", key: "provider" },
  { id: "module-payroll", answer: "test", record: "module", key: "payroll" },
  {
    id: "tier-pro",
    answer: "test",
    record: "tier",
    key: "pro",
    rank: 2,
    features: ["reports"],
    limits: { "catalogue.product_limit": null, "tills.device_limit": 10 },
    seats: { provider: 5 },
    modules: ["payroll"],
  },
  {
    id: "tier-starter",
    answer: "test",
    record: "tier",
    key: "starter",
    rank: 1,
    seats: { full: 1 },
  },
  { id: "trial", answer: "C8", record: "trial", tier: "pro", days: 14, cardRequired: false },
];

describe("planCatalogueOf", () => {
  it("reads every record kind", () => {
    const catalogue = planCatalogueOf(CATALOGUE_ROWS);
    expect(catalogue.tiers.map((tier) => tier.key)).toEqual(["starter", "pro"]);
    expect(catalogue.tiers[1]?.limits).toEqual({
      "catalogue.product_limit": Number.POSITIVE_INFINITY,
      "tills.device_limit": 10,
    });
    expect(catalogue.tiers[0]).toMatchObject({ features: [], modules: [], limits: {} });
    expect(catalogue.seatKinds).toEqual([{ key: "full" }, { key: "provider" }]);
    expect(catalogue.modules).toEqual([{ key: "payroll" }]);
    expect(catalogue.trials).toEqual([{ tier: "pro", days: 14, cardRequired: false }]);
  });

  it("refuses bad rows by id", () => {
    expect(() => planCatalogueOf([{ id: "x", record: "coupon" }])).toThrow(
      /row x has unknown record/,
    );
    expect(() => planCatalogueOf([{ id: "x", record: "tier", key: "pro", rank: -1 }])).toThrow(
      RangeError,
    );
    expect(() =>
      planCatalogueOf([{ id: "x", record: "tier", key: "pro", rank: 1, seats: { full: null } }]),
    ).toThrow(RangeError);
    expect(() =>
      planCatalogueOf([{ id: "x", record: "tier", key: "pro", rank: 1, features: [1] }]),
    ).toThrow(RangeError);
    expect(() =>
      planCatalogueOf([{ id: "x", record: "tier", key: "pro", rank: 1, limits: [] }]),
    ).toThrow(RangeError);
    expect(() => planCatalogueOf([{ id: "x", record: "trial", tier: "pro", days: 14 }])).toThrow(
      /cardRequired/,
    );
  });

  it("refuses duplicates and unknown references", () => {
    const seat = { id: "a", record: "seat_kind", key: "full" };
    expect(() => planCatalogueOf([seat, { ...seat, id: "b" }])).toThrow(/row b repeats full/);
    expect(() =>
      planCatalogueOf([{ id: "t", record: "tier", key: "pro", rank: 1, seats: { support: 1 } }]),
    ).toThrow(/unknown seat kind support/);
    expect(() =>
      planCatalogueOf([{ id: "t", record: "tier", key: "pro", rank: 1, modules: ["clinic"] }]),
    ).toThrow(/unknown module clinic/);
    expect(() =>
      planCatalogueOf([{ id: "t", record: "trial", tier: "pro", days: 14, cardRequired: false }]),
    ).toThrow(/unknown tier pro/);
  });
});
