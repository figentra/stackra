/**
 * Stackra file contract:
 * Purpose: unit test of `OriginNotAllowedError`: a forbidden refusal coded `origin_not_allowed`, not retryable.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140 (error envelope and kinds); ADR 0437.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { OriginNotAllowedError } from "#server/errors/origin-not-allowed.error";

describe("OriginNotAllowedError", () => {
  it("is a forbidden refusal coded origin_not_allowed", () => {
    const error = OriginNotAllowedError.create();
    expect(isRefusal(error, OriginNotAllowedError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Forbidden);
    expect(error.code).toBe("origin_not_allowed");
    expect(error.retryable).toBe(false);
  });
});
