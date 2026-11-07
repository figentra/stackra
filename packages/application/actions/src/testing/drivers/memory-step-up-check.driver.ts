/**
 * Stackra file contract:
 * Purpose: `MemoryStepUpCheckDriver`, the "memory" `StepUpCheck` a test picks with `.useDrivers("memory")`: a call
 *          passes only when it carries assurance at or above the level the action declares (pass
 *          `{ as, assurance: { amr: ["hwk"], authTime, level: AssuranceLevel.Aal2 } }` to `run`), and is refused
 *          `step_up_required` otherwise, as identity's driver would refuse it (STA-340).
 * Boundary: test only. It compares levels and does not check freshness; identity's `IdentityStepUpCheckDriver`
 *           does both in a running service.
 * Runtime: node
 * Governing contract: ADR 0406; ADR 0269 (decision 3); STA-340.
 */
import { Driver } from "@stackra/container";
import { AssuranceLevel, Enum } from "@stackra/contracts";

import { StepUpCheck } from "#contracts/index";
import type { CallAssurance, CallDescriptor } from "#contracts/index";
import { StepUpRequiredError } from "#testing/errors/step-up-required.error";

const ORDER: readonly AssuranceLevel[] = Enum.values(AssuranceLevel);

/** Passes a call whose assurance reaches the declared level; refuses one without it. */
export class MemoryStepUpCheckDriver extends Driver(StepUpCheck) {
  /**
   * Checks the call's assurance against `level`.
   *
   * @throws StepUpRequiredError when the call carries no assurance or a weaker one.
   */
  async require(
    _call: CallDescriptor,
    assurance: CallAssurance | undefined,
    level: AssuranceLevel,
  ): Promise<void> {
    const reached = assurance?.level;
    if (reached === undefined || ORDER.indexOf(reached) < ORDER.indexOf(level))
      throw StepUpRequiredError.create();
  }
}
