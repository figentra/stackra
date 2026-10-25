/**
 * Stackra file contract:
 * Purpose: unit tests of `valuesOn`: dated values within a pack, the overlay over its parent only while its entry is in force, provenance and floors, and a refused date.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expect, it } from "@stackra/testing";

import { FloorBound } from "#core/enums/floor-bound.enum";
import { PackStatus } from "#core/enums/pack-status.enum";
import { valuesOn } from "#core/functions/values-on.function";
import type { MarketPack } from "#core/types/market-pack.type";
import type { ResolvedPack } from "#core/types/resolved-pack.type";

/** A pack version with empty lists, changed by `change`. */
function pack(change: Partial<MarketPack> & Pick<MarketPack, "market" | "version">): MarketPack {
  return { status: PackStatus.Live, entries: [], reviews: [], checklist: [], ...change };
}

const resolved: ResolvedPack = {
  market: "xa-one",
  layers: [
    pack({
      market: "xa",
      version: "2.0.0",
      entries: [
        { key: "tax.rate", value: 7, from: "2026-01-01", until: "2026-06-30" },
        { key: "tax.rate", value: 8, from: "2026-07-01" },
        {
          key: "fee.cap",
          value: 50,
          from: "2026-01-01",
          floor: { bound: FloorBound.Max, law: "Made-up Act s. 2" },
        },
        {
          key: "consumer.withdrawal_days",
          value: 10,
          from: "2026-01-01",
          floor: { bound: FloorBound.Min, law: "Made-up Act s. 1" },
        },
      ],
    }),
    pack({
      market: "xa-one",
      extends: "xa",
      version: "1.0.0",
      entries: [
        {
          key: "consumer.withdrawal_days",
          value: 12,
          from: "2026-03-01",
          floor: { bound: FloorBound.Min, law: "Made-up Local Act s. 9" },
        },
        { key: "tax.rate", value: 9, from: "2026-01-01", until: "2026-01-31" },
      ],
    }),
  ],
};

describe("valuesOn", () => {
  it("picks the dated value in force", () => {
    expect(valuesOn(resolved, "2026-06-30").get("tax.rate")?.value).toBe(7);
    expect(valuesOn(resolved, "2026-07-01").get("tax.rate")?.value).toBe(8);
  });

  it("lets the overlay win only while its entry is in force", () => {
    expect(valuesOn(resolved, "2026-01-15").get("tax.rate")).toEqual({
      key: "tax.rate",
      value: 9,
      market: "xa-one",
      version: "1.0.0",
    });
    expect(valuesOn(resolved, "2026-02-01").get("tax.rate")?.market).toBe("xa");
    expect(valuesOn(resolved, "2026-02-01").get("consumer.withdrawal_days")?.value).toBe(10);
    expect(valuesOn(resolved, "2026-03-01").get("consumer.withdrawal_days")).toEqual({
      key: "consumer.withdrawal_days",
      value: 12,
      market: "xa-one",
      version: "1.0.0",
      floor: { bound: "min", law: "Made-up Local Act s. 9" },
    });
  });

  it("has nothing before the first entry starts", () => {
    expect(valuesOn(resolved, "2025-12-31").size).toBe(0);
  });

  it("takes the latest start when two entries cover the date", () => {
    const overlapping: ResolvedPack = {
      market: "xa",
      layers: [
        pack({
          market: "xa",
          version: "1.0.0",
          entries: [
            { key: "a", value: 1, from: "2026-01-01" },
            { key: "a", value: 2, from: "2026-02-01" },
          ],
        }),
      ],
    };
    expect(valuesOn(overlapping, "2026-03-01").get("a")?.value).toBe(2);
  });

  it("refuses a date that is not YYYY-MM-DD", () => {
    expect(() => valuesOn(resolved, "2026-7-1")).toThrow(RangeError);
  });
});
