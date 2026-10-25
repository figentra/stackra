/**
 * Stackra file contract:
 * Purpose: unit test of `DEVTOOLS_BUFFER_SIZE`: the replay buffer holds 500 entries, a positive whole number.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0246 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { DEVTOOLS_BUFFER_SIZE } from "#core/constants/devtools-buffer-size.constant";

describe("DEVTOOLS_BUFFER_SIZE", () => {
  it("is 500, a positive whole number", () => {
    expect(DEVTOOLS_BUFFER_SIZE).toBe(500);
    expect(Number.isInteger(DEVTOOLS_BUFFER_SIZE)).toBe(true);
  });
});
