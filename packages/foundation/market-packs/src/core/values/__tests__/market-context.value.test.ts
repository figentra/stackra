/**
 * Stackra file contract:
 * Purpose: unit tests of `MarketContext`: `packFor` answers a rule kind from the market of its subject (buyer,
 *          location, entity), from the tenant's market when the pack names none, refuses a record without the
 *          subject's market, and resolves nested overlays with a section per overlay.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0385.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { PackStatus } from "#core/enums/pack-status.enum";
import { PackSubject } from "#core/enums/pack-subject.enum";
import { SubjectMarketMissingError } from "#core/errors/subject-market-missing.error";
import { valueOf } from "#core/functions/value-of.function";
import type { MarketPack } from "#core/types/market-pack.type";
import { MarketContext } from "#core/values/market-context.value";

/** A pack version with empty lists, changed by `change`. */
function pack(change: Partial<MarketPack> & Pick<MarketPack, "market">): MarketPack {
  return {
    version: "1.0.0",
    status: PackStatus.Live,
    entries: [],
    reviews: [],
    checklist: [],
    ...change,
  };
}

const packs = [
  pack({
    market: "xa",
    subjects: [
      { key: "tax.sales", subject: PackSubject.Buyer },
      { key: "tips", subject: PackSubject.Location },
      { key: "registration", subject: PackSubject.Entity },
    ],
    entries: [
      { key: "tax.sales.rate", value: 0, from: "2026-01-01" },
      { key: "currency", value: "XAD", from: "2026-01-01" },
    ],
  }),
  pack({
    market: "xa-one",
    extends: "xa",
    entries: [{ key: "tax.sales.rate", value: 5, from: "2026-01-01" }],
  }),
  pack({
    market: "xa-two",
    extends: "xa",
    entries: [{ key: "tax.sales.rate", value: 7, from: "2026-01-01" }],
  }),
  pack({ market: "xa-two-city", extends: "xa-two" }),
  pack({
    market: "xa-two-city",
    section: "food",
    entries: [{ key: "food.tip_credit", value: 2, from: "2026-01-01" }],
  }),
  pack({
    market: "xa-two",
    section: "food",
    entries: [{ key: "food.tip_credit", value: 1, from: "2026-01-01" }],
  }),
];

const context = MarketContext.create(packs, { sections: ["food"] });

describe("MarketContext", () => {
  it("answers a buyer rule from the buyer's market", () => {
    const resolved = context.packFor({ tenant: "xa-one", buyer: "xa-two" }, "tax.sales.rate");
    expect(resolved.market).toBe("xa-two");
    expect(valueOf(resolved, "tax.sales.rate", "2026-07-01")?.value).toBe(7);
  });

  it("answers a location rule through nested overlays and the overlay's section", () => {
    const resolved = context.packFor({ tenant: "xa-one", location: "xa-two-city" }, "tips");
    expect(resolved.layers.map((layer) => `${layer.market}/${layer.section ?? ""}`)).toEqual([
      "xa/",
      "xa-two/",
      "xa-two/food",
      "xa-two-city/",
      "xa-two-city/food",
    ]);
    expect(valueOf(resolved, "food.tip_credit", "2026-07-01")).toMatchObject({
      value: 2,
      market: "xa-two-city",
    });
  });

  it("answers an undeclared rule kind from the tenant's market", () => {
    const resolved = context.packFor({ tenant: "xa-one", buyer: "xa-two" }, "currency");
    expect(resolved.market).toBe("xa-one");
    expect(context.packFor({ tenant: "xa-one" }, "currency")).toBe(resolved);
  });

  it("refuses a record without the subject's market", () => {
    const error: unknown = (() => {
      try {
        return context.packFor({ tenant: "xa-one" }, "registration.threshold");
      } catch (caught) {
        return caught;
      }
    })();
    expect(isRefusal(error, SubjectMarketMissingError) && [error.subject, error.ruleKind]).toEqual([
      "entity",
      "registration.threshold",
    ]);
  });
});
