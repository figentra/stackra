/**
 * Stackra file contract:
 * Purpose: unit tests of `topological`: a key comes after its dependencies, ties keep source order, a dependency
 *          outside the keys is ignored and a cycle keeps source order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); spec sta-2061 (FR-009, EC-05).
 */
import { describe, expect, it } from "@stackra/testing";

import { topological } from "#core/functions/topological.function";

describe("topological", () => {
  it("puts a key after its dependencies", () => {
    expect(topological(["a", "b"], new Map([["a", ["b"]]]))).toEqual(["b", "a"]);
  });

  it("keeps source order for keys with no edge, and ignores a dependency outside the keys", () => {
    expect(topological(["b", "a"], new Map([["a", ["zz"]]]))).toEqual(["b", "a"]);
  });

  it("ends a cycle without looping, each key once", () => {
    expect(
      topological(
        ["a", "b"],
        new Map([
          ["a", ["b"]],
          ["b", ["a"]],
        ]),
      ),
    ).toEqual(["b", "a"]);
  });
});
