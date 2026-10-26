/**
 * Stackra file contract:
 * Purpose: unit tests of `PayoutHeldError`: a failed_precondition refusal with its code, retryability and reference.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; R4-6.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { PayoutHeldError } from "#core/errors/payout-held.error";

describe("PayoutHeldError", () => {
  it("is a failed_precondition refusal carrying its reference", () => {
    const refusal = PayoutHeldError.create({ reference: "po_9" });
    expect(isRefusal(refusal, PayoutHeldError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("payout_held");
    expect(refusal.retryable).toBe(true);
    expect(refusal.details).toEqual({ reference: "po_9" });
  });
});
