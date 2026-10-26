/**
 * Stackra file contract:
 * Purpose: type tests of `OnboardingStep`: the unit, stage and request id, and no issued secret.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { OnboardingStep } from "#contracts/types/onboarding-step.type";

describe("OnboardingStep", () => {
  it("carries the public facts and refuses a secret", () => {
    const step: OnboardingStep = { unitId: "till_1", stage: "compliance", requestId: null };
    // @ts-expect-error -- the secret stays in the credential store
    const leaked: OnboardingStep = { ...step, secret: "s" };
    expect([step.stage, leaked.unitId]).toEqual(["compliance", "till_1"]);
  });
});
