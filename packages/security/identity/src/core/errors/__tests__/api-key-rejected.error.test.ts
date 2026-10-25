/**
 * Stackra file contract:
 * Purpose: unit tests of `ApiKeyRejectedError`: kind `Unauthenticated`, retryable false, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ApiKeyRejectedError } from "#core/errors/api-key-rejected.error";

describe("ApiKeyRejectedError", () => {
  it("is a Unauthenticated refusal", () => {
    const error = ApiKeyRejectedError.create();
    expect(isRefusal(error)).toBe(true);
    expect(error.code).toBe("api_key_rejected");
    expect(error.kind).toBe(ErrorKind.Unauthenticated);
    expect(error.retryable).toBe(false);
    expect(error.details).toEqual({});
  });
});
