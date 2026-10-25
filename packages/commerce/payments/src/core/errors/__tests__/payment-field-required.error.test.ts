/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymentFieldRequiredError`: a non-retryable `validation` refusal, code `payment_field_required`, whose details are its
 *          fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0328.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { PaymentFieldRequiredError } from "#core/errors/payment-field-required.error";

describe("PaymentFieldRequiredError", () => {
  it("is a validation refusal carrying its details", () => {
    const refusal = PaymentFieldRequiredError.create({
      provider: "tamara",
      field: "customer.address",
    });
    expect(isRefusal(refusal, PaymentFieldRequiredError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.Validation);
    expect(refusal.code).toBe("payment_field_required");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ provider: "tamara", field: "customer.address" });
  });
});
