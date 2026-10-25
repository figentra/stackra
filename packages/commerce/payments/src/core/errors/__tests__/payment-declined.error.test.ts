/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymentDeclinedError`: a non-retryable `failed_precondition` refusal, code `payment_declined`, whose details are its
 *          fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0328.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { PaymentDeclinedError } from "#core/errors/payment-declined.error";

describe("PaymentDeclinedError", () => {
  it("is a failed_precondition refusal carrying its details", () => {
    const refusal = PaymentDeclinedError.create({
      provider: "tabby",
      providerCode: "not_available",
    });
    expect(isRefusal(refusal, PaymentDeclinedError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("payment_declined");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ provider: "tabby", providerCode: "not_available" });
  });
});
