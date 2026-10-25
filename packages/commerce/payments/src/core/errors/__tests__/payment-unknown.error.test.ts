/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymentUnknownError`: a non-retryable `failed_precondition` refusal, code `payment_unknown`, whose details are its
 *          fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0328.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { PaymentUnknownError } from "#core/errors/payment-unknown.error";

describe("PaymentUnknownError", () => {
  it("is a failed_precondition refusal carrying its details", () => {
    const refusal = PaymentUnknownError.create({ reference: "ord_1" });
    expect(isRefusal(refusal, PaymentUnknownError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("payment_unknown");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ reference: "ord_1" });
  });
});
