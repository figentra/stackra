/**
 * Stackra file contract:
 * Purpose: `PlanLimitReservationDriver`, the driver of the action pipeline's `LimitReservation` port (from
 *          `@stackra/actions`): for an action call that a registered limit entitlement gates (gen puts a limit's gate on
 *          its counted model's generated create), it runs the call's unit of work inside
 *          `LimitReservationService.reserve`, so two creates racing at a plan limit can never both pass.
 * Boundary: which call counts against which limit is the entitlement registry gen writes (`gates`), never a verb this
 *           driver parses. A call no limit gates commits as it is. A call two limits gate reserves both, in
 *           registration order, each lock held until the commit ends. The grant, the count, grace and the refusals are
 *           the service's (`entitlement_required`, `limit_reached`). Bound with `PlanEntitlementCheckDriver`, whose
 *           snapshot check still refuses early; this driver is the one that holds.
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (as amended: reserve-then-commit wraps the unit of work); ADR 0215 (decisions 3 and
 *                     4); ADR 0397 (decision 3); owner round 3 item 18; STA-765.
 */
import { type CallDescriptor, LimitReservation } from "@stackra/actions/contracts";
import { Driver, kindOf } from "@stackra/container";

import { ENTITLEMENT_REGISTRY } from "#core/constants/entitlement-registry.constant";
import type { LimitReservationService } from "#core/services/limit-reservation.service";
import type { EntitlementClass } from "#core/types/entitlement-class.type";
import type { EntitlementOptions } from "#core/types/entitlement-options.type";

/**
 * Holds a plan limit around each create it gates.
 *
 * @example
 * container.bind(LimitReservation, PlanLimitReservationDriver);
 */
export class PlanLimitReservationDriver extends Driver(LimitReservation) {
  /** The reserve-then-commit service. */
  private readonly reservations: LimitReservationService;

  /**
   * @param reservations - the service that locks, checks and commits.
   */
  constructor(reservations: LimitReservationService) {
    super();
    this.reservations = reservations;
  }

  /**
   * Runs `commit` under every limit that gates `call`, or as it is when none does.
   *
   * @throws EntitlementRequiredError when a gating limit is not in the scope's plan; `commit` did not run.
   * @throws LimitReachedError when a gating limit is full; `commit` did not run.
   */
  reserve<T>(call: CallDescriptor, _input: unknown, commit: () => Promise<T>): Promise<T> {
    const limits: EntitlementClass[] = [];
    for (const { type, gates } of ENTITLEMENT_REGISTRY.values()) {
      const { counts } = (kindOf(type)?.options ?? {}) as unknown as EntitlementOptions;
      if (counts !== undefined && gates.includes(call.type)) limits.push(type);
    }
    const scope = call.scope?.id;
    return limits.reduceRight<() => Promise<T>>(
      (inner, limit) => () => this.reservations.reserve(limit, scope, inner),
      commit,
    )();
  }
}
