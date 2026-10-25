/**
 * Stackra file contract:
 * Purpose: unit tests of `InvalidPaymentTransitionError`: a non-retryable `failed_precondition` refusal, code `invalid_payment_transition`, whose details are its
 *          fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0328.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { InvalidPaymentTransitionError } from "#core/errors/invalid-payment-transition.error";

describe("InvalidPaymentTransitionError", () => {
  it("is a failed_precondition refusal carrying its details", () => {
    const refusal = InvalidPaymentTransitionError.create({
      reference: "ord_1",
      status: "voided",
      operation: "capture",
    });
    expect(isRefusal(refusal, InvalidPaymentTransitionError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("invalid_payment_transition");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ reference: "ord_1", status: "voided", operation: "capture" });
  });
});
