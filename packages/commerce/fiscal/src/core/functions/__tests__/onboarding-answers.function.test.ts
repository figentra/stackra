/**
 * Stackra file contract:
 * Purpose: unit tests of `onboardingAnswers`: listed inputs come back trimmed, extra answers are dropped, and a missing
 *          or blank input is refused by its code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { OnboardingInput } from "#contracts/enums/onboarding-input.enum";
import { FiscalOnboardingInputMissingError } from "#core/errors/fiscal-onboarding-input-missing.error";
import { onboardingAnswers } from "#core/functions/onboarding-answers.function";

const INPUTS = [OnboardingInput.Otp, OnboardingInput.Csr];

describe("onboardingAnswers", () => {
  it("returns the listed inputs trimmed and drops the rest", () => {
    expect(
      onboardingAnswers({ otp: " 123456 ", csr: "CSR", client_id: "x" }, INPUTS, "till_1", "zatca"),
    ).toEqual({ otp: "123456", csr: "CSR" });
  });

  it.each([{ otp: "123456" }, { otp: "123456", csr: "  " }])(
    "refuses a missing or blank input: %o",
    (answers) => {
      let caught: unknown;
      try {
        onboardingAnswers(answers, INPUTS, "till_1", "zatca");
      } catch (error) {
        caught = error;
      }
      expect(isRefusal(caught, FiscalOnboardingInputMissingError) && caught.details.input).toBe(
        "csr",
      );
    },
  );
});
