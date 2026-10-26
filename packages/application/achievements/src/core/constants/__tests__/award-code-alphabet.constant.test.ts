/**
 * Stackra file contract:
 * Purpose: unit test of `AWARD_CODE_ALPHABET`: 32 distinct characters without the Crockford look-alikes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0432 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { AWARD_CODE_ALPHABET } from "#core/constants/award-code-alphabet.constant";

describe("AWARD_CODE_ALPHABET", () => {
  it("is Crockford base32", () => {
    expect(new Set(AWARD_CODE_ALPHABET).size).toBe(32);
    expect(AWARD_CODE_ALPHABET).not.toMatch(/[ILOU]/);
  });
});
