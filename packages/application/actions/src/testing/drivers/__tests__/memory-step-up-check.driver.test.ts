/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryStepUpCheckDriver`: a call carrying assurance at or above the declared level passes;
 *          a call without assurance, or with a weaker one, is refused `step_up_required` (STA-340).
 * Boundary: test only; the driver alone, without a pipeline.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0406; STA-340.
 */
import { AssuranceLevel } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { CallDescriptor } from "#contracts/index";
import { MemoryStepUpCheckDriver } from "#testing/drivers/memory-step-up-check.driver";
import { StepUpRequiredError } from "#testing/errors/step-up-required.error";

const driver = new MemoryStepUpCheckDriver();
const call = {} as CallDescriptor;
const at = (level: AssuranceLevel) => ({ amr: ["hwk"], authTime: new Date(), level });

describe("MemoryStepUpCheckDriver", () => {
  it("passes a call at the declared level or above", async () => {
    await expect(
      driver.require(call, at(AssuranceLevel.Aal2), AssuranceLevel.Aal2),
    ).resolves.toBeUndefined();
    await expect(
      driver.require(call, at(AssuranceLevel.Aal3), AssuranceLevel.Aal2),
    ).resolves.toBeUndefined();
  });

  it("refuses a call without assurance, and one weaker than the declared level", async () => {
    await expect(driver.require(call, undefined, AssuranceLevel.Aal2)).rejects.toBeInstanceOf(
      StepUpRequiredError,
    );
    await expect(
      driver.require(call, at(AssuranceLevel.Aal1), AssuranceLevel.Aal2),
    ).rejects.toBeInstanceOf(StepUpRequiredError);
  });
});
