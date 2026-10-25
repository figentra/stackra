/**
 * Stackra file contract:
 * Purpose: unit tests of `InsufficientPointsError`: a non-retryable `failed_precondition` refusal, code
 *          `insufficient_points`, whose details are the balance and the request.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0232; ADR 0328.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { InsufficientPointsError } from "#core/errors/insufficient-points.error";

describe("InsufficientPointsError", () => {
  it("is a failed precondition carrying the balance and the request", () => {
    const refusal = InsufficientPointsError.create({ balance: 40, requested: 100 });
    expect(isRefusal(refusal, InsufficientPointsError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("insufficient_points");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ balance: 40, requested: 100 });
  });
});
