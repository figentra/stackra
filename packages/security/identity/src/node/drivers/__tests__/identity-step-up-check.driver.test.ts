/**
 * Stackra file contract:
 * Purpose: unit tests of `IdentityStepUpCheckDriver`: a fresh call at the declared level passes; a call without
 *          assurance, a weaker one and one older than `stepUpMaxAgeMinutes` are refused `step_up_required` (STA-340).
 * Boundary: test only; the defaults of `IdentityConfig` and a frozen clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0406; STA-340.
 */
import type { CallDescriptor } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { AssuranceLevel, Clock } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { IdentityConfig } from "#config/identity.config";
import { StepUpRequiredError } from "#core/errors/step-up-required.error";
import { IdentityStepUpCheckDriver } from "#node/drivers/identity-step-up-check.driver";

const NOW = new Date("2026-11-07T12:00:00Z");

/** A clock frozen at `NOW`. */
class FrozenClock extends Clock {
  /** Always `NOW`. */
  now(): Date {
    return new Date(NOW);
  }
}

const config = buildConfig(IdentityConfig);
const driver = new IdentityStepUpCheckDriver(config, new FrozenClock());
const call = {} as CallDescriptor;
const minutesAgo = (minutes: number): Date => new Date(NOW.getTime() - minutes * 60_000);

describe("IdentityStepUpCheckDriver", () => {
  it("passes a fresh call at the declared level or above", async () => {
    for (const level of [AssuranceLevel.Aal2, AssuranceLevel.Aal3])
      await expect(
        driver.require(call, { amr: ["hwk"], authTime: minutesAgo(1), level }, AssuranceLevel.Aal2),
      ).resolves.toBeUndefined();
  });

  it("refuses a call without assurance, a weaker one and a stale one", async () => {
    const fresh = minutesAgo(1);
    const stale = minutesAgo(config.stepUpMaxAgeMinutes + 1);
    for (const assurance of [
      undefined,
      { amr: ["pwd"], authTime: fresh, level: AssuranceLevel.Aal1 },
      { amr: ["hwk"], authTime: stale, level: AssuranceLevel.Aal2 },
      { amr: ["hwk"], authTime: undefined, level: AssuranceLevel.Aal2 },
    ])
      await expect(driver.require(call, assurance, AssuranceLevel.Aal2)).rejects.toBeInstanceOf(
        StepUpRequiredError,
      );
  });
});
