/**
 * Stackra file contract:
 * Purpose: `PlanEntitlementCheckDriver`, the driver of the action pipeline's entitlement step (`EntitlementCheck` from
 *          `@stackra/actions`): for each registered entitlement that gates the call it asks the `EntitlementSource` for
 *          the grant in the call's scope (`call.scope`, by its id) and, for a limit, the `EntitlementUsage` for the
 *          current count there (narrowed by the limit's `where` filter, STA-913), and for a quota the `MeterTotals` for
 *          the meter's total in the current period (stackra-309); a call without a scope asks for the platform-wide
 *          grant.
 * Boundary: plugs into the step `ActionPipeline` already runs after the preconditions and before the flag step; it adds
 *           no second gate. A right that is not granted refuses `entitlement_required`; a limit already reached
 *           refuses `limit_reached`, unless the grant is a soft limit whose grace period still runs (owner round 3
 *           #18). A quota whose period total already reaches its allowance refuses `quota_exceeded`; a soft quota in its
 *           grace period passes and tells the optional `QuotaWarnings`. A quota-gated call with no `MeterTotals` bound
 *           throws, never passes unmetered. The total is read before the call, so one call may overshoot the
 *           allowance by its own units (ADR 0216 open question 1). A value entitlement (ADR 0408) gates only by being
 *           in the plan. A grant of the wrong shape is a source bug and throws a `TypeError`. A call no entitlement gates
 *           passes without asking the source. The check reads a snapshot, so two creates racing at the limit may both
 *           pass; a create that must never pass the limit runs inside `LimitReservationService.reserve`.
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (as amended: entitlement after precondition); ADR 0215 (decisions 1 and 3); ADR 0294
 *                     (decisions 16 and 17); ADR 0270 (collaboration gated by an entitlement); ADR 0327 (decision 6:
 *                     the call's scope); ADR 0216 (decision 3: quotas from meters, stackra-309).
 */
import { type CallDescriptor, EntitlementCheck } from "@stackra/actions/contracts";
import { Driver, kindOf } from "@stackra/container";
import type { Clock, PublicId } from "@stackra/contracts";
import { EntitlementRequiredError } from "@stackra/errors";

import { ENTITLEMENT_REGISTRY } from "#core/constants/entitlement-registry.constant";
import { EntitlementKind } from "#core/enums/entitlement-kind.enum";
import type { QuotaPeriod } from "#core/enums/quota-period.enum";
import { LimitReachedError } from "#core/errors/limit-reached.error";
import { QuotaExceededError } from "#core/errors/quota-exceeded.error";
import { isLimitGrant } from "#core/functions/is-limit-grant.function";
import { limitAllows } from "#core/functions/limit-allows.function";
import { isValueGrant } from "#core/functions/is-value-grant.function";
import { limitOf } from "#core/functions/limit-of.function";
import { quotaWindow } from "#core/functions/quota-window.function";
import type { EntitlementSource } from "#core/ports/entitlement-source.port";
import type { EntitlementUsage } from "#contracts/ports/entitlement-usage.port";
import type { MeterTotals } from "#contracts/ports/meter-totals.port";
import type { QuotaWarnings } from "#contracts/ports/quota-warnings.port";
import type { LimitGrant } from "#contracts/types/limit-grant.type";
import type { EntitlementOptions } from "#core/types/entitlement-options.type";

/**
 * Refuses a call the scope's plan does not cover.
 *
 * @example
 * const check = new PlanEntitlementCheckDriver(source, usage);
 * await check.check(call); // throws LimitReachedError when the plan's two products already exist
 */
export class PlanEntitlementCheckDriver extends Driver(EntitlementCheck) {
  /** Where grants come from. */
  private readonly source: EntitlementSource;

  /** Where a limit's current count comes from. */
  private readonly usage: EntitlementUsage;

  /** The time a grace period ends against; the system time when none is bound. */
  private readonly clock: Clock | undefined;

  /** Where a quota's period total comes from; none bound refuses every quota-gated call. */
  private readonly totals: MeterTotals | undefined;

  /** Who hears that a soft quota passed in its grace period; none bound stays silent. */
  private readonly warnings: QuotaWarnings | undefined;

  /**
   * @param source - the plan service's snapshot or the licence.
   * @param usage - the counter of the counted models.
   * @param clock - the time a grace period ends and a quota period is read against; the system time when left out.
   * @param totals - the usage service's meter totals, for quota entitlements.
   * @param warnings - told when a soft quota passes past its allowance.
   */
  constructor(
    source: EntitlementSource,
    usage: EntitlementUsage,
    clock?: Clock,
    totals?: MeterTotals,
    warnings?: QuotaWarnings,
  ) {
    super();
    this.source = source;
    this.usage = usage;
    this.clock = clock;
    this.totals = totals;
    this.warnings = warnings;
  }

  /**
   * Resolves when the scope's plan grants every entitlement that gates `call`.
   *
   * @throws EntitlementRequiredError when a gating right is not in the plan.
   * @throws LimitReachedError when a gating limit's count already equals or passes the grant and no grace period runs.
   * @throws QuotaExceededError when a gating quota's period total already equals or passes the grant and no grace
   *         period runs.
   * @throws Error when a quota gates the call and no `MeterTotals` is bound.
   * @throws TypeError when the source answers a count for a feature or module, a boolean `true` for a limit, or
   *         anything but a number for a value.
   */
  async check(call: CallDescriptor): Promise<void> {
    const scope = call.scope?.id;
    for (const { type, key, gates } of ENTITLEMENT_REGISTRY.values()) {
      if (!gates.includes(call.type)) continue;
      // `Entitlement` records `counts` for a limit and only for a limit.
      const { kind, counts, where, meter, per } = (kindOf(type)?.options ??
        {}) as unknown as EntitlementOptions;
      const grant = await this.source.grant(type, scope);
      if (grant === undefined || grant === false) throw EntitlementRequiredError.create();
      if (kind === EntitlementKind.Value) {
        // A value gates a call only by being in the plan; the number is read where it is used.
        if (!isValueGrant(grant))
          throw new TypeError(
            `${key} is a value, so its source answers a number, not ${JSON.stringify(grant)}`,
          );
        continue;
      }
      if (kind === EntitlementKind.Quota && meter !== undefined && per !== undefined) {
        if (!isLimitGrant(grant))
          throw new TypeError(`${key} is a quota, so its source answers a count, not ${grant}`);
        await this.checkQuota(key, grant, meter, per, scope);
        continue;
      }
      if (counts === undefined) {
        if (grant !== true)
          throw new TypeError(
            `${key} is granted or not, so its source answers a boolean, not ${JSON.stringify(grant)}`,
          );
        continue;
      }
      if (!isLimitGrant(grant))
        throw new TypeError(`${key} is a limit, so its source answers a count, not ${grant}`);
      if (limitOf(grant) === Number.POSITIVE_INFINITY) continue;
      const count = await this.usage.count(counts(), scope, where);
      if (!limitAllows(grant, count, this.clock?.now() ?? new Date()))
        throw LimitReachedError.create({ entitlement: key, limit: limitOf(grant) });
    }
  }

  /** Refuses once the quota's period total reaches the grant; warns when a soft quota passes past it. */
  private async checkQuota(
    key: string,
    grant: number | LimitGrant,
    meter: string,
    per: QuotaPeriod,
    scope: PublicId | undefined,
  ): Promise<void> {
    const limit = limitOf(grant);
    if (limit === Number.POSITIVE_INFINITY) return;
    if (this.totals === undefined)
      throw new Error(`${key} is a quota, so a MeterTotals must be bound to read ${meter}`);
    const now = this.clock?.now() ?? new Date();
    const { from, to } = quotaWindow(per, now);
    const used = await this.totals.total(meter, scope, from, to);
    if (!limitAllows(grant, used, now))
      throw QuotaExceededError.create({
        entitlement: key,
        meter,
        limit,
        resetsAt: to.toISOString(),
      });
    if (used >= limit) await this.warnings?.warn(key, scope, used, limit);
  }
}
