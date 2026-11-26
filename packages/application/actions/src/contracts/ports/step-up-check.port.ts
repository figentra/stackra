/**
 * Stackra file contract:
 * Purpose: the `StepUpCheck` port: the step-up part of the permission step. For an action that declares `stepUp`,
 *          called by a user (the pipeline asks no other actor kind, ADR 0406 as amended), it
 *          decides whether the call's verified assurance reaches that level and is recent enough, and refuses
 *          `step_up_required` when it does not.
 * Boundary: an abstract class that is its own token, keyed `actions.StepUpCheck`. How recent is recent enough is the
 *           identity configuration (`IdentityConfig.stepUpMaxAgeMinutes`), never code here: the bound driver wraps
 *           `@stackra/identity`'s `requireAssurance`. An action that declares `stepUp` with no driver bound fails
 *           closed. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0207 (decision 1); ADR 0406; STA-814; ADR 0509 (`at`, FR-016 (b)).
 */
import { type AssuranceLevel, Port } from "@stackra/contracts";

import type { CallAssurance } from "#contracts/types/call-assurance.type";
import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

/**
 * Checks a call's assurance against an action's step-up level.
 *
 * @example
 * export class IdentityStepUpCheckDriver extends Driver(StepUpCheck) {
 *   async require(call: CallDescriptor, assurance: CallAssurance | undefined, level: AssuranceLevel): Promise<void> {
 *     requireAssurance(
 *       { level: assurance?.level, authenticatedAt: assurance?.authTime },
 *       level,
 *       this.identity,
 *       this.clock.now(),
 *     );
 *   }
 * }
 */
export abstract class StepUpCheck extends Port {
  /** Type-only port key, so `DriverName<StepUpCheck>` narrows to this port's drivers. */
  declare readonly "~key": "actions.StepUpCheck";

  /**
   * Resolves when `assurance` meets `level` for `call`; rejects with a `step_up_required` refusal otherwise (no
   * assurance, a weaker level, or an authentication older than the configured window). `at` is the moment the
   * window is measured at: the clock's now when absent, a parked call's `requestedAt` when the pipeline executes an
   * approved call (ADR 0509, FR-016 (b)); a driver that ignores it measures against now.
   */
  abstract require(
    call: CallDescriptor,
    assurance: CallAssurance | undefined,
    level: AssuranceLevel,
    at?: Date,
  ): Promise<void>;
}
