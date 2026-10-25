/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalOnboardingRefusedError`: a `fiscal_onboarding_refused` refusal of kind
 *          `FailedPrecondition` whose details are its fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0364.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalOnboardingRefusedError } from "#core/errors/fiscal-onboarding-refused.error";

describe("FiscalOnboardingRefusedError", () => {
  it("carries its kind, code, retry flag and details", () => {
    const refusal = FiscalOnboardingRefusedError.create({ unitId: "till_1", status: 400 });
    expect(isRefusal(refusal, FiscalOnboardingRefusedError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("fiscal_onboarding_refused");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ unitId: "till_1", status: 400 });
  });
});
