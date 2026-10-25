/**
 * Stackra file contract:
 * Purpose: unit tests of `SignInCancelledError`: code `sign_in_cancelled`, kind `unauthenticated`, retryable, no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; final review R-02.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SignInCancelledError } from "#core/errors/sign-in-cancelled.error";

describe("SignInCancelledError", () => {
  it("is a retryable unauthenticated refusal with no details", () => {
    const error = SignInCancelledError.create();
    expect(isRefusal(error)).toBe(true);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("sign_in_cancelled");
    expect(error.kind).toBe(ErrorKind.Unauthenticated);
    expect(error.retryable).toBe(true);
    expect(error.details).toEqual({});
  });
});
