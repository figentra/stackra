/**
 * Stackra file contract:
 * Purpose: `IdentityStepUpCheckDriver`, the `identity` driver of the actions pipeline's `StepUpCheck`: it delegates to
 *          `requireAssurance`, so the level an action declares and the freshness window
 *          (`IdentityConfig.stepUpMaxAgeMinutes`) are enforced. gen binds it by default in a service that declares
 *          `@stackra/identity` (STA-340), so an action with `stepUp` never fails closed there by accident.
 * Boundary: implements the port only. The call's `authTime` is the last authentication, measured against the clock;
 *           a call without assurance fails closed as `step_up_required`. A host without `@stackra/identity` binds no
 *           driver, and its step-up actions fail closed (ADR 0406 decision 4). Moved from os's developer-platform.
 * Runtime: node
 * Governing contract: ADR 0207 (decision 1); ADR 0406; STA-712; STA-340.
 */
import { type CallAssurance, type CallDescriptor, StepUpCheck } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import type { AssuranceLevel, Clock } from "@stackra/contracts";

import type { IdentityConfig } from "#config/identity.config";
import { requireAssurance } from "#core/functions/require-assurance.function";

/** Delegates the step-up check to identity's assurance rule. */
export class IdentityStepUpCheckDriver extends Driver(StepUpCheck) {
  /** The step-up window. */
  private readonly identity: IdentityConfig;

  /** The time source. */
  private readonly clock: Clock;

  /**
   * @param identity - the identity configuration (the step-up window).
   * @param clock - the time source.
   */
  constructor(identity: IdentityConfig, clock: Clock) {
    super();
    this.identity = identity;
    this.clock = clock;
  }

  /**
   * Checks the call's assurance against `level`.
   *
   * @throws StepUpRequiredError when the assurance is missing, weaker than `level` or older than the window.
   */
  async require(
    _call: CallDescriptor,
    assurance: CallAssurance | undefined,
    level: AssuranceLevel,
  ): Promise<void> {
    requireAssurance(
      { level: assurance?.level, authenticatedAt: assurance?.authTime },
      level,
      this.identity,
      this.clock.now(),
    );
  }
}
