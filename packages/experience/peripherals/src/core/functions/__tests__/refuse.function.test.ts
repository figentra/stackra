/**
 * Stackra file contract:
 * Purpose: unit tests of `refuse`: it builds the failed capability result with the code and the capability.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { refuse } from "#core/functions/refuse.function";

describe("refuse", () => {
  it("builds the refusal envelope", () => {
    expect(refuse("print", "permission_denied")).toEqual({
      ok: false,
      error: { code: "permission_denied", capability: "print" },
    });
  });
});
