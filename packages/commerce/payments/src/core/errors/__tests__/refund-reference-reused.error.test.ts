/**
 * Stackra file contract:
 * Purpose: unit tests of `RefundReferenceReusedError`: a conflict refusal, code derived from the class name, details are ids.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0357 (decision 5).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { RefundReferenceReusedError } from "#core/errors/refund-reference-reused.error";

describe("RefundReferenceReusedError", () => {
  it("is a conflict refusal carrying its details", () => {
    const refusal = RefundReferenceReusedError.create({
      reference: "ord_1",
      refundReference: "r1",
    });
    expect(isRefusal(refusal, RefundReferenceReusedError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.Conflict);
    expect(refusal.code).toBe("refund_reference_reused");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ reference: "ord_1", refundReference: "r1" });
  });
});
