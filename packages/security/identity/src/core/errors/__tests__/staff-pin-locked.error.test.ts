/**
 * Stackra file contract:
 * Purpose: unit tests of `StaffPinLockedError`: kind `RateLimited`, retryable true, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { StaffPinLockedError } from "#core/errors/staff-pin-locked.error";

describe("StaffPinLockedError", () => {
  it("is a RateLimited refusal", () => {
    const error = StaffPinLockedError.create();
    expect(isRefusal(error)).toBe(true);
    expect(error.code).toBe("staff_pin_locked");
    expect(error.kind).toBe(ErrorKind.RateLimited);
    expect(error.retryable).toBe(true);
    expect(error.details).toEqual({});
  });
});
