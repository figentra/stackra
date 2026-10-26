/**
 * Stackra file contract:
 * Purpose: the `LimitReservation` port: reserve-then-commit around an action's unit of work. The pipeline hands every
 *          applied action call's commit to it; for a call that creates a counted model, the driver holds the limit's
 *          lock, checks the grant and the count, runs the commit and releases, so two creates racing at a plan limit
 *          can never both pass, and no action writes reservation code itself.
 * Boundary: an abstract class that is its own token, keyed `actions.LimitReservation`. `@stackra/entitlements`
 *           implements it over its `LimitReservationService` (which call creates which counted model is its limit
 *           registry, never a verb this package parses); a call it does not count runs `commit` as it is. An app that
 *           binds none has no plan limits, so the step is skipped. Actions only; a query never commits. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (as amended: reserve-then-commit wraps the unit of work); ADR 0215 (decisions 3 and 4);
 *                     owner round 3 item 18 (reserve-then-commit).
 */
import { Port } from "@stackra/contracts";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

/**
 * Reserves plan limits around a commit.
 *
 * @example
 * export class PlanLimitReservationDriver extends Driver(LimitReservation) {
 *   reserve<T>(call: CallDescriptor, _input: unknown, commit: () => Promise<T>): Promise<T> {
 *     const limit = this.limits.creating(call.key);
 *     return limit === undefined ? commit() : this.reservations.reserve(limit, call.scope?.id, commit);
 *   }
 * }
 */
export abstract class LimitReservation extends Port {
  /** Type-only port key, so `DriverName<LimitReservation>` narrows to this port's drivers. */
  declare readonly "~key": "actions.LimitReservation";

  /**
   * Runs `commit` (the call's unit of work) once the limits `call` with `input` counts against allow one more, and
   * resolves to its result; runs it as it is when the call counts against no limit.
   *
   * @throws a Refusal (`limit_reached`, `entitlement_required`) when the limit is full; `commit` did not run.
   */
  abstract reserve<T>(call: CallDescriptor, input: unknown, commit: () => Promise<T>): Promise<T>;
}
