/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalOnboardingUnsupportedError`: a `fiscal_onboarding_unsupported` refusal of kind
 *          `FailedPrecondition` whose details are its fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0364.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalOnboardingUnsupportedError } from "#core/errors/fiscal-onboarding-unsupported.error";

describe("FiscalOnboardingUnsupportedError", () => {
  it("carries its kind, code, retry flag and details", () => {
    const refusal = FiscalOnboardingUnsupportedError.create({ driver: "nf525" });
    expect(isRefusal(refusal, FiscalOnboardingUnsupportedError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("fiscal_onboarding_unsupported");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ driver: "nf525" });
  });
});
