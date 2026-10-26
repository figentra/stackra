/**
 * Stackra file contract:
 * Purpose: unit tests of `overlayFloorIssues`: an overlay as strict as or stricter than its parent's floor passes; one
 *          that goes below a `min`, above a `max`, changes an unordered floor or replaces a floor with a plain value is
 *          reported once, on the first day; a floor that only starts later, or ends before the overlay, is checked on
 *          the right days; keys the parent does not floor are ignored.
 * Boundary: test only. Packs are made-up fixtures (`xa`, `xa-one`), not any market's values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0417.
 */
import { describe, expect, it } from "@stackra/testing";

import { FloorBound } from "#core/enums/floor-bound.enum";
import { PackStatus } from "#core/enums/pack-status.enum";
import { overlayFloorIssues } from "#core/functions/overlay-floor-issues.function";
import type { MarketPack } from "#core/types/market-pack.type";
import type { ResolvedPack } from "#core/types/resolved-pack.type";

const MIN = { bound: FloorBound.Min, law: "Act 1" };

const MAX = { bound: FloorBound.Max, law: "Act 2" };

/** A pack version of `market` with `entries`. */
function pack(market: string, entries: MarketPack["entries"]): MarketPack {
  return {
    market,
    ...(market === "xa" ? {} : { extends: "xa" }),
    version: "1.0.0",
    status: PackStatus.Draft,
    entries,
    reviews: [],
    checklist: [],
  };
}

const parent: ResolvedPack = {
  market: "xa",
  layers: [
    pack("xa", [
      { key: "leave.days", value: 14, from: "2020-01-01", floor: MIN },
      { key: "fee.cap", value: 5, from: "2020-01-01", floor: MAX },
      { key: "notice.form", value: "written", from: "2020-01-01", floor: MIN },
      { key: "late.days", value: 3, from: "2027-01-01", floor: MIN },
      { key: "old.days", value: 3, from: "2020-01-01", until: "2024-12-31", floor: MIN },
      { key: "plain.days", value: 3, from: "2020-01-01" },
    ]),
  ],
};

const issues = (entries: MarketPack["entries"]) =>
  overlayFloorIssues(pack("xa-one", entries), parent).map((issue) => `${issue.code} ${issue.key}`);

describe("overlayFloorIssues", () => {
  it("passes an overlay at least as strict as its parent", () => {
    expect(
      issues([
        { key: "leave.days", value: 20, from: "2026-01-01", floor: MIN },
        { key: "fee.cap", value: 4, from: "2026-01-01", floor: MAX },
        { key: "notice.form", value: "written", from: "2026-01-01", floor: MIN },
        { key: "plain.days", value: 0, from: "2026-01-01" },
      ]),
    ).toEqual([]);
  });

  it("reports a floor loosened past either bound or changed when unordered", () => {
    expect(
      issues([
        { key: "leave.days", value: 10, from: "2026-01-01", floor: MIN },
        { key: "fee.cap", value: 6, from: "2026-01-01", floor: MAX },
        { key: "notice.form", value: "oral", from: "2026-01-01", floor: MIN },
      ]),
    ).toEqual([
      "floor_loosened leave.days",
      "floor_loosened fee.cap",
      "floor_loosened notice.form",
    ]);
  });

  it("reports a floor replaced by a plain value or the other bound, once", () => {
    expect(
      issues([
        { key: "leave.days", value: 20, from: "2026-01-01" },
        { key: "leave.days", value: 21, from: "2026-06-01" },
        { key: "fee.cap", value: 4, from: "2026-01-01", floor: MIN },
      ]),
    ).toEqual(["floor_dropped leave.days", "floor_dropped fee.cap"]);
  });

  it("checks a parent floor that starts after the overlay's entry", () => {
    const found = overlayFloorIssues(
      pack("xa-one", [{ key: "late.days", value: 1, from: "2026-01-01", floor: MIN }]),
      parent,
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.message).toContain("2027-01-01");
  });

  it("ignores a parent floor no longer in force", () => {
    expect(issues([{ key: "old.days", value: 0, from: "2025-01-01" }])).toEqual([]);
    expect(issues([{ key: "old.days", value: 0, from: "2024-06-01" }])).toEqual([
      "floor_dropped old.days",
    ]);
  });
});
