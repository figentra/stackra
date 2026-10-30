/**
 * Stackra file contract:
 * Purpose: proves `transferKeys` adds and removes keys in item order and never moves a disabled or unknown item.
 * Boundary: pure function test.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
import { transferKeys } from "#core/functions/transfer-keys.function";

const ITEMS = [
  { id: "a", label: "A" },
  { id: "b", label: "B" },
  { id: "c", label: "C", isDisabled: true },
  { id: "d", label: "D" },
];

describe("transferKeys", () => {
  it("adds keys in the order the items are listed", () => {
    expect(transferKeys(["d"], ITEMS, ["b", "a"], "chosen")).toEqual(["a", "b", "d"]);
  });

  it("removes keys", () => {
    expect(transferKeys(["a", "b", "d"], ITEMS, ["b"], "available")).toEqual(["a", "d"]);
  });

  it("never moves a disabled or unknown item", () => {
    expect(transferKeys([], ITEMS, ["c", "x"], "chosen")).toEqual([]);
    expect(transferKeys(["c"], ITEMS, ["c"], "available")).toEqual(["c"]);
  });
});
