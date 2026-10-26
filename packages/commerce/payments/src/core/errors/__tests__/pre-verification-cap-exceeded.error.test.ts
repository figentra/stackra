/**
 * Stackra file contract:
 * Purpose: unit tests of `PreVerificationCapExceededError`: a failed_precondition refusal with its code, retryability and reference.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; R4-6.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { PreVerificationCapExceededError } from "#core/errors/pre-verification-cap-exceeded.error";

describe("PreVerificationCapExceededError", () => {
  it("is a failed_precondition refusal carrying its reference", () => {
    const refusal = PreVerificationCapExceededError.create({ reference: "ord_9" });
    expect(isRefusal(refusal, PreVerificationCapExceededError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("pre_verification_cap_exceeded");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ reference: "ord_9" });
  });
});
