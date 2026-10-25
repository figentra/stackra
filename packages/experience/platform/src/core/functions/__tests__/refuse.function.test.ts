/**
 * Stackra file contract:
 * Purpose: unit tests of `refuse`: the failed result names the code and the capability.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { refuse } from "#core/functions/refuse.function";

describe("refuse", () => {
  it("builds a typed refusal", () => {
    expect(refuse("share", "unavailable")).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "share" },
    });
  });
});
