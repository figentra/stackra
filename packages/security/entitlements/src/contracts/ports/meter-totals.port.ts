/**
 * Stackra file contract:
 * Purpose: the `MeterTotals` port: how much of a meter (`usage.recorded` events of that meter name) a scope used in a
 *          window, so the plan driver can refuse a call once a quota entitlement's allowance is used up.
 * Boundary: an abstract class that is its own token, implemented by the usage service that aggregates the meters (an
 *           OS service, ADR 0216 decisions 3 and 5); this package never reads usage events. The total is the meter's
 *           aggregate (a count, a sum of units) over `[from, to)`.
 * Runtime: isomorphic
 * Governing contract: ADR 0216 (decisions 3, 5 and 6: aggregation in the usage service, free contracts here); ADR 0263
 *                     (ports resolve by type); stackra-309.
 */
import { Port, type PublicId } from "@stackra/contracts";

/**
 * Answers a meter's total in one scope and window.
 *
 * @example
 * export class UsageMeterTotalsDriver extends Driver(MeterTotals) {
 *   total(meter: string, scope: PublicId | undefined, from: Date, to: Date): Promise<number> {
 *     return this.rollups.sum(meter, scope, from, to);
 *   }
 * }
 */
export abstract class MeterTotals extends Port {
  /**
   * The total of `meter` in `scope` from `from` (inclusive) to `to` (exclusive).
   *
   * @param meter - the meter's name as an action's `meter.name` declares it (`ai.tokens`).
   * @param scope - the id of the call's `ScopeRef`; `undefined` for a platform-wide call.
   */
  abstract total(meter: string, scope: PublicId | undefined, from: Date, to: Date): Promise<number>;
}
