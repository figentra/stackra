/**
 * Stackra file contract:
 * Purpose: unit tests of `BearerTokenInvalidError`: an unauthenticated, non-retryable refusal coded
 *          `bearer_token_invalid`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0206 (decision 8).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { BearerTokenInvalidError } from "#server/errors/bearer-token-invalid.error";

describe("BearerTokenInvalidError", () => {
  it("is an unauthenticated refusal coded bearer_token_invalid", () => {
    const error = BearerTokenInvalidError.create();
    expect(isRefusal(error, BearerTokenInvalidError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Unauthenticated);
    expect(error.code).toBe("bearer_token_invalid");
    expect(error.retryable).toBe(false);
  });
});
