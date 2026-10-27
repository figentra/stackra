/**
 * Stackra file contract:
 * Purpose: unit tests of `subjectOf`: the longest matching key wins, a later layer wins for the same key, a key only
 *          matches whole dotted segments, and no declaration means the tenant.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0385.
 */
import { describe, expect, it } from "@stackra/testing";

import { PackStatus } from "#core/enums/pack-status.enum";
import { PackSubject } from "#core/enums/pack-subject.enum";
import { subjectOf } from "#core/functions/subject-of.function";
import type { MarketPack } from "#core/types/market-pack.type";

/** A pack version with the given subjects. */
function layer(market: string, subjects: MarketPack["subjects"]): MarketPack {
  return {
    market,
    version: "1.0.0",
    status: PackStatus.Live,
    entries: [],
    reviews: [],
    checklist: [],
    ...(subjects === undefined ? {} : { subjects }),
  };
}

const resolved = {
  market: "xa-one",
  layers: [
    layer("xa", [
      { key: "tax", subject: PackSubject.Buyer },
      { key: "tax.registration", subject: PackSubject.Entity },
      { key: "tips", subject: PackSubject.Location },
    ]),
    layer("xa-one", [{ key: "tips", subject: PackSubject.Scope }]),
  ],
};

describe("subjectOf", () => {
  it("takes the longest matching key", () => {
    expect(subjectOf(resolved, "tax.sales.rate")).toBe(PackSubject.Buyer);
    expect(subjectOf(resolved, "tax.registration.threshold")).toBe(PackSubject.Entity);
    expect(subjectOf(resolved, "tax")).toBe(PackSubject.Buyer);
  });

  it("lets a later layer restate a key", () => {
    expect(subjectOf(resolved, "tips.pooling")).toBe(PackSubject.Scope);
  });

  it("matches whole segments only and falls back to the tenant", () => {
    expect(subjectOf(resolved, "taxi.fare")).toBe(PackSubject.Scope);
    expect(subjectOf({ market: "xa", layers: [layer("xa", undefined)] }, "tax")).toBe(
      PackSubject.Scope,
    );
  });
});
