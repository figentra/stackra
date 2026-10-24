/**
 * Stackra file contract:
 * Purpose: proves `keysOfSelection` turns `"all"` into every id, turns a `Set` into strings in the items' order rather
 *          than the order of the presses, keeps a key the collection no longer holds, and reads numeric keys as strings.
 * Boundary: pure unit test.
 * Runtime: node
 * Governing contract: ADR 0313; ADR 0022 (test placement).
 */
// @covers sta-350:FR-122
import { keysOfSelection } from "#core/functions/keys-of-selection.function";

const ALL = ["a", "b", "c"] as const;

describe("keysOfSelection", () => {
  it("turns `all` into every id", () => {
    expect(keysOfSelection("all", ALL)).toEqual(["a", "b", "c"]);
  });

  it("orders the keys as the items are, not as they were pressed", () => {
    expect(keysOfSelection(new Set(["c", "a"]), ALL)).toEqual(["a", "c"]);
  });

  it("keeps a key the collection no longer holds, after the others", () => {
    expect(keysOfSelection(new Set(["gone", "b"]), ALL)).toEqual(["b", "gone"]);
  });

  it("reads numeric keys as strings", () => {
    expect(keysOfSelection(new Set([2]), ["1", "2"])).toEqual(["2"]);
  });

  it("returns an empty list for an empty selection", () => {
    expect(keysOfSelection(new Set(), ALL)).toEqual([]);
  });
});
