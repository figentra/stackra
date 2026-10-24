/**
 * Stackra file contract:
 * Purpose: unit tests of `remoteRefusal`: a service's refusal class with the module and code apart and the manifest's
 *          kind and `retryable`.
 * Boundary: test only; the refusal restates the template's generated `services/commerce` payments client.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140 (kinds).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { refusal } from "@stackra/errors/testing";
import { describe, expect, it } from "@stackra/testing";

import { remoteRefusal } from "#core/functions/remote-refusal.function";

class PaymentNotFoundError extends remoteRefusal("payments", "payment_not_found", {
  kind: ErrorKind.NotFound,
  retryable: false,
}) {}

describe("remoteRefusal", () => {
  it("is the module's refusal with the declared kind", () => {
    const error = refusal(PaymentNotFoundError);
    expect(isRefusal(error, PaymentNotFoundError)).toBe(true);
    expect(error.code).toBe("payment_not_found");
    expect(error.kind).toBe(ErrorKind.NotFound);
    expect(error.retryable).toBe(false);
    expect(PaymentNotFoundError.qualifiedCode).toBe("payments.payment_not_found");
  });

  it("refuses a module that is not snake_case", () => {
    expect(() =>
      remoteRefusal("Payments", "payment_not_found", { kind: ErrorKind.NotFound }),
    ).toThrow(RangeError);
  });
});
