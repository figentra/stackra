/**
 * Stackra file contract:
 * Purpose: unit tests of `diffSettingsPacks`: added, changed, removed and relocked paths across groups, sorted, and no
 *          row for an unchanged path.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { diffSettingsPacks } from "#core/functions/diff-settings-packs.function";

describe("diffSettingsPacks", () => {
  it("lists each path whose value or lock differs, sorted by group then path", () => {
    const base = {
      groups: {
        orders: { values: { a: 1, b: true, c: "x" }, locked: ["c"] },
        old: { values: { z: null }, locked: [] },
      },
    };
    const next = {
      groups: {
        orders: { values: { a: 2, b: true, c: "x", d: 4 }, locked: [] },
      },
    };
    expect(diffSettingsPacks(base, next)).toEqual([
      { group: "old", path: "z", before: null, lockedBefore: false, lockedAfter: false },
      { group: "orders", path: "a", before: 1, after: 2, lockedBefore: false, lockedAfter: false },
      {
        group: "orders",
        path: "c",
        before: "x",
        after: "x",
        lockedBefore: true,
        lockedAfter: false,
      },
      { group: "orders", path: "d", after: 4, lockedBefore: false, lockedAfter: false },
    ]);
  });

  it("gives no row for equal packs", () => {
    const pack = { groups: { orders: { values: { a: 1 }, locked: ["a"] } } };
    expect(diffSettingsPacks(pack, pack)).toEqual([]);
  });
});
