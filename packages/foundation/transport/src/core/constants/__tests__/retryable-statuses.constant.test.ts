/**
 * Stackra file contract:
 * Purpose: unit tests of `RETRYABLE_STATUSES`: derived from `ErrorKind`, it holds exactly 429 and 503 today.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0140 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { RETRYABLE_STATUSES } from "#core/constants/retryable-statuses.constant";

describe("RETRYABLE_STATUSES", () => {
  it("holds the statuses of the retryable kinds", () => {
    expect([...RETRYABLE_STATUSES].sort()).toEqual([429, 503]);
  });
});
