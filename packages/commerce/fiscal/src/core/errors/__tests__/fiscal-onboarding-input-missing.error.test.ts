/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalOnboardingInputMissingError`: a `fiscal_onboarding_input_missing` refusal of kind
 *          `Validation` whose details are its fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0364.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalOnboardingInputMissingError } from "#core/errors/fiscal-onboarding-input-missing.error";

describe("FiscalOnboardingInputMissingError", () => {
  it("carries its kind, code, retry flag and details", () => {
    const refusal = FiscalOnboardingInputMissingError.create({
      unitId: "till_1",
      driver: "eta",
      input: "client_id",
    });
    expect(isRefusal(refusal, FiscalOnboardingInputMissingError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.Validation);
    expect(refusal.code).toBe("fiscal_onboarding_input_missing");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ unitId: "till_1", driver: "eta", input: "client_id" });
  });
});
