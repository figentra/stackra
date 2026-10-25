/**
 * Stackra file contract:
 * Purpose: unit tests of `SeatLimitReachedError`: code `seat_limit_reached`, kind `entitlement_required`, not
 *          retryable, carrying the seat kind and the allowance.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; owner XP-1.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SeatLimitReachedError } from "#core/errors/seat-limit-reached.error";

describe("SeatLimitReachedError", () => {
  it("is a non-retryable entitlement refusal naming the seat kind and its allowance", () => {
    const error = SeatLimitReachedError.create({ seatKind: "provider", limit: 3 });
    expect(isRefusal(error)).toBe(true);
    expect(error.code).toBe("seat_limit_reached");
    expect(error.kind).toBe(ErrorKind.EntitlementRequired);
    expect(error.retryable).toBe(false);
    expect(error.details).toEqual({ seatKind: "provider", limit: 3 });
  });
});
