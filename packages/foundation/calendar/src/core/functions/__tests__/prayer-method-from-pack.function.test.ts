/**
 * Stackra file contract:
 * Purpose: unit tests of `prayerMethodFromPack`: the method comes from the pack key in force through an overlay with
 *          its defaults filled, and a missing or invalid value is refused.
 * Boundary: test only; packs are built in place with `@stackra/market-packs` types. The values are a made-up fixture,
 *           not any market's decision (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0414.
 */
import { type MarketPack, PackStatus, resolvePack } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { prayerMethodFromPack } from "#core/functions/prayer-method-from-pack.function";

/** A live pack version. */
function pack(market: string, entries: MarketPack["entries"], parent?: string): MarketPack {
  return {
    market,
    ...(parent === undefined ? {} : { extends: parent }),
    version: "1.0.0",
    status: PackStatus.Live,
    entries,
    reviews: [],
    checklist: [],
  };
}

const BASE = { fajrAngle: 18, ishaAngle: 17, asrFactor: 1, highLatitude: "angle_based" };

describe("prayerMethodFromPack", () => {
  it("reads the method in force through an overlay", () => {
    const resolved = resolvePack(
      [
        pack("xa", [{ key: "calendar.prayer_times", value: BASE, from: "2020-01-01" }]),
        pack(
          "xa-one",
          [{ key: "calendar.prayer_times", value: { ...BASE, asrFactor: 2 }, from: "2027-01-01" }],
          "xa",
        ),
      ],
      "xa-one",
    );
    expect(prayerMethodFromPack(resolved, "2026-06-01")).toEqual({ ...BASE, maghribMinutes: 0 });
    expect(prayerMethodFromPack(resolved, "2027-06-01").asrFactor).toBe(2);
  });

  it("refuses a market with no method or an invalid one", () => {
    expect(() => prayerMethodFromPack(resolvePack([pack("xa", [])], "xa"), "2026-06-01")).toThrow(
      "xa sets no calendar.prayer_times on 2026-06-01",
    );
    const invalid = resolvePack(
      [
        pack("xa", [
          { key: "calendar.prayer_times", value: { ...BASE, asrFactor: 3 }, from: "2020-01-01" },
        ]),
      ],
      "xa",
    );
    expect(() => prayerMethodFromPack(invalid, "2026-06-01")).toThrow(RangeError);
  });
});
