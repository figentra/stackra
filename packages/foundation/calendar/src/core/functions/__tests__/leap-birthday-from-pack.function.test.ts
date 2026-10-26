/**
 * Stackra file contract:
 * Purpose: unit tests of `leapBirthdayFromPack`: the rule comes from the pack key in force through an overlay, and a
 *          missing or unknown value is refused.
 * Boundary: test only; packs are built in place with `@stackra/market-packs` types. The values are a made-up fixture,
 *           not any market's law (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0387.
 */
import { type MarketPack, PackStatus, resolvePack } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { LeapBirthday } from "#core/enums/leap-birthday.enum";
import { leapBirthdayFromPack } from "#core/functions/leap-birthday-from-pack.function";

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

describe("leapBirthdayFromPack", () => {
  it("reads the rule in force through an overlay", () => {
    const packs = [
      pack("xa", [{ key: "calendar.leap_birthday", value: "march_1", from: "2020-01-01" }]),
      pack(
        "xa-one",
        [{ key: "calendar.leap_birthday", value: "february_28", from: "2027-01-01" }],
        "xa",
      ),
    ];
    const resolved = resolvePack(packs, "xa-one");
    expect(leapBirthdayFromPack(resolved, "2026-06-01")).toBe(LeapBirthday.March1);
    expect(leapBirthdayFromPack(resolved, "2027-06-01")).toBe(LeapBirthday.February28);
  });

  it("refuses a missing or unknown value", () => {
    expect(() => leapBirthdayFromPack(resolvePack([pack("xb", [])], "xb"), "2026-06-01")).toThrow(
      RangeError,
    );
    const odd = [
      pack("xc", [{ key: "calendar.leap_birthday", value: "march_2", from: "2020-01-01" }]),
    ];
    expect(() => leapBirthdayFromPack(resolvePack(odd, "xc"), "2026-06-01")).toThrow(RangeError);
  });
});
