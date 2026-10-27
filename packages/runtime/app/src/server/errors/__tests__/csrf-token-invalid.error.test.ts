/**
 * Stackra file contract:
 * Purpose: unit test of `CsrfTokenInvalidError`: a forbidden refusal coded `csrf_token_invalid`, not retryable.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140 (error envelope and kinds); ADR 0437.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { CsrfTokenInvalidError } from "#server/errors/csrf-token-invalid.error";

describe("CsrfTokenInvalidError", () => {
  it("is a forbidden refusal coded csrf_token_invalid", () => {
    const error = CsrfTokenInvalidError.create();
    expect(isRefusal(error, CsrfTokenInvalidError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Forbidden);
    expect(error.code).toBe("csrf_token_invalid");
    expect(error.retryable).toBe(false);
  });
});
