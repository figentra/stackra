/**
 * Stackra file contract:
 * Purpose: unit tests of `kindNames`: the first name of a kind number wins over a later marker alias, string members
 *          are ignored.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { kindNames } from "#node/functions/kind-names.function";

describe("kindNames", () => {
  it("keeps the first name of each kind", () => {
    const names = kindNames({
      NumericLiteral: 9,
      FirstLiteralToken: 9,
      StringLiteral: 11,
      "9": "NumericLiteral",
    });
    expect(names.get(9)).toBe("NumericLiteral");
    expect(names.get(11)).toBe("StringLiteral");
    expect(names.size).toBe(2);
  });
});
