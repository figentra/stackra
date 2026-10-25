/**
 * Stackra file contract:
 * Purpose: unit test of `BLOCK_ID_PATTERN`: UUIDs and derived ids pass; dots, spaces, empty and over-long ids do not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { BLOCK_ID_PATTERN } from "#core/constants/block-id-pattern.constant";

describe("BLOCK_ID_PATTERN", () => {
  it("takes UUIDs and derived ids only", () => {
    for (const id of ["0b6f0c52-6d0f-4f8e-9a51-3f4f1f0e2c11", "b0", "hero_section", "x".repeat(64)])
      expect(BLOCK_ID_PATTERN.test(id)).toBe(true);
    for (const id of ["", "a.b", "a b", "x".repeat(65)])
      expect(BLOCK_ID_PATTERN.test(id)).toBe(false);
  });
});
