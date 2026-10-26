/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalOnboarding`: an abstract port a mandate implements; its key, inputs and two steps.
 * Boundary: test only; a minimal driver stands in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0260 (decision 9); ADR 0364.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { OnboardingInput } from "#contracts/enums/onboarding-input.enum";
import { FiscalOnboarding } from "#contracts/ports/fiscal-onboarding.port";
import type { OnboardingStep } from "#contracts/types/onboarding-step.type";

/** A mandate that registers on the code alone. */
class CodeOnly extends FiscalOnboarding {
  readonly key = "code-only";
  readonly inputs = [OnboardingInput.Otp];

  async register(unitId: string): Promise<OnboardingStep> {
    return { unitId, stage: "compliance", requestId: "1" };
  }

  async complete(unitId: string): Promise<OnboardingStep> {
    return { unitId, stage: "production", requestId: "2" };
  }
}

describe("FiscalOnboarding", () => {
  it("is a port with a key, its inputs and two steps", async () => {
    const onboarding = new CodeOnly();
    expect(onboarding).toBeInstanceOf(Port);
    expect([onboarding.key, onboarding.inputs]).toEqual(["code-only", ["otp"]]);
    expect((await onboarding.register("u")).stage).toBe("compliance");
    expect((await onboarding.complete("u")).stage).toBe("production");
  });
});
