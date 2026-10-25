/**
 * Stackra file contract:
 * Purpose: unit tests of `StaffPinRejectedError`: kind `Unauthenticated`, retryable true, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { StaffPinRejectedError } from "#core/errors/staff-pin-rejected.error";

describe("StaffPinRejectedError", () => {
  it("is a Unauthenticated refusal", () => {
    const error = StaffPinRejectedError.create();
    expect(isRefusal(error)).toBe(true);
    expect(error.code).toBe("staff_pin_rejected");
    expect(error.kind).toBe(ErrorKind.Unauthenticated);
    expect(error.retryable).toBe(true);
    expect(error.details).toEqual({});
  });
});
