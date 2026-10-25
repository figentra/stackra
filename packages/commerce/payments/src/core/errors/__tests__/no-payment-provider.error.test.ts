/**
 * Stackra file contract:
 * Purpose: unit tests of `NoPaymentProviderError`: a non-retryable `failed_precondition` refusal, code `no_payment_provider`, whose details are its
 *          fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0328.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { NoPaymentProviderError } from "#core/errors/no-payment-provider.error";

describe("NoPaymentProviderError", () => {
  it("is a failed_precondition refusal carrying its details", () => {
    const refusal = NoPaymentProviderError.create({ market: "zz", needs: "checkout,capture" });
    expect(isRefusal(refusal, NoPaymentProviderError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("no_payment_provider");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ market: "zz", needs: "checkout,capture" });
  });
});
