/**
 * Stackra file contract:
 * Purpose: unit tests of `MerchantInitiatedNotAllowedError`: a non-retryable `failed_precondition` refusal, code `merchant_initiated_not_allowed`, whose details are its
 *          fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0328.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { MerchantInitiatedNotAllowedError } from "#core/errors/merchant-initiated-not-allowed.error";

describe("MerchantInitiatedNotAllowedError", () => {
  it("is a failed_precondition refusal carrying its details", () => {
    const refusal = MerchantInitiatedNotAllowedError.create({ reference: "inv_7" });
    expect(isRefusal(refusal, MerchantInitiatedNotAllowedError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("merchant_initiated_not_allowed");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ reference: "inv_7" });
  });
});
