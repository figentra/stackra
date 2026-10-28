/**
 * Stackra file contract:
 * Purpose: unit tests of `offerOf`: benefit and eligibility rows become an offer; unknown kinds, out-of-range percentages and missing or repeated eligibility are refused.
 * Boundary: test only; rows are test data standing in for `offer:<name>` and `rate-card:<name>` seed records.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0393 (decision 2); owner M3-6.
 */
import { describe, expect, it } from "@stackra/testing";

import { offerOf } from "#core/functions/offer-of.function";

const ELIGIBILITY = {
  id: "eligibility",
  record: "eligibility",
  packs: ["ae", "eg"],
  products: ["commerce"],
  ruleSet: "rule-set:os:startup-perk-eligibility",
  capPerPack: { eg: 100 },
};

describe("offerOf", () => {
  it("reads every benefit kind and the eligibility", () => {
    const offer = offerOf("offer:startup", [
      { id: "half", record: "benefit", kind: "percent", basisPoints: 5000, months: 12 },
      {
        id: "ai",
        record: "benefit",
        kind: "credit_grant",
        credit: "ai",
        units: 1000,
        period: "month",
        months: 12,
      },
      { id: "move", record: "benefit", kind: "free_migration" },
      { id: "crm", record: "benefit", kind: "module_grant", module: "crm", months: null },
      ELIGIBILITY,
    ]);
    expect(offer.benefits).toEqual([
      { kind: "percent", basisPoints: 5000, months: 12 },
      { kind: "credit_grant", credit: "ai", units: 1000, period: "month", months: 12 },
      { kind: "free_migration" },
      { kind: "module_grant", module: "crm", months: null },
    ]);
    expect(offer.eligibility).toEqual({
      packs: ["ae", "eg"],
      products: ["commerce"],
      ruleSet: "rule-set:os:startup-perk-eligibility",
      capPerPack: { eg: 100 },
    });
  });

  it("defaults an absent rule set and caps", () => {
    const offer = offerOf("offer:annual", [
      { id: "e", record: "eligibility", packs: ["ae"], products: ["os"] },
    ]);
    expect(offer.eligibility).toMatchObject({ ruleSet: null, capPerPack: {} });
  });

  it("refuses malformed offers", () => {
    expect(() => offerOf("offer:x", [])).toThrow(/has no eligibility row/);
    expect(() => offerOf("offer:x", [ELIGIBILITY, { ...ELIGIBILITY, id: "again" }])).toThrow(
      /second eligibility/,
    );
    expect(() => offerOf("offer:x", [{ ...ELIGIBILITY, packs: [] }])).toThrow(/non-empty list/);
    expect(() => offerOf("offer:x", [{ ...ELIGIBILITY, capPerPack: [] }])).toThrow(
      /map in capPerPack/,
    );
    expect(() => offerOf("offer:x", [{ id: "c", record: "coupon" }])).toThrow(
      /unknown record coupon/,
    );
    expect(() => offerOf("offer:x", [{ id: "b", record: "benefit", kind: "cashback" }])).toThrow(
      /unknown benefit/,
    );
    expect(() =>
      offerOf("offer:x", [{ id: "b", record: "benefit", kind: "percent", basisPoints: 10_001 }]),
    ).toThrow(/10,000/);
    expect(() =>
      offerOf("offer:x", [
        { id: "b", record: "benefit", kind: "credit_grant", credit: "ai", units: 1, period: "day" },
      ]),
    ).toThrow(/unknown period day/);
  });
});
