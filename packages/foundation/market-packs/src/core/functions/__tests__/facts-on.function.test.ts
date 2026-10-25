/**
 * Stackra file contract:
 * Purpose: unit tests of `factsOn`: a plain key-to-value record of the values in force.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expect, it } from "@stackra/testing";

import { FloorBound } from "#core/enums/floor-bound.enum";
import { PackStatus } from "#core/enums/pack-status.enum";
import { factsOn } from "#core/functions/facts-on.function";
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

describe("factsOn", () => {
  it("maps each key in force to its value", () => {
    expect(factsOn(resolved, "2026-07-01")).toEqual({
      "tax.rate": 8,
      "fee.cap": 50,
      "consumer.withdrawal_days": 12,
    });
  });
});
