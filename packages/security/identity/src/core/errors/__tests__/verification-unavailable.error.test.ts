/**
 * Stackra file contract:
 * Purpose: unit tests of `VerificationUnavailableError`: kind `Unavailable`, retryable true, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { VerificationUnavailableError } from "#core/errors/verification-unavailable.error";

describe("VerificationUnavailableError", () => {
  it("is a Unavailable refusal", () => {
    const error = VerificationUnavailableError.create();
    expect(isRefusal(error)).toBe(true);
    expect(error.code).toBe("verification_unavailable");
    expect(error.kind).toBe(ErrorKind.Unavailable);
    expect(error.retryable).toBe(true);
    expect(error.details).toEqual({});
  });
});
