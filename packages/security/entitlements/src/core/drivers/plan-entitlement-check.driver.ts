/**
 * Stackra file contract:
 * Purpose: `PlanEntitlementCheckDriver`, the driver of the action pipeline's entitlement step (`EntitlementCheck` from
 *          `@stackra/actions`): for each registered entitlement that gates the call it asks the `EntitlementSource` for
 *          the grant in the call's scope (`call.scope`, by its id) and, for a limit, the `EntitlementUsage` for the
 *          current count there; a call without a scope asks for the platform-wide grant.
 * Boundary: plugs into the step `ActionPipeline` already runs after the preconditions and before the flag step; it adds
 *           no second gate. A right that is not granted refuses `entitlement_required`; a limit already reached
 *           refuses `limit_reached`. A grant of the wrong shape is a source bug and throws a `TypeError`. A call no
 *           entitlement gates passes without asking the source. The check reads a snapshot, so two creates racing at
 *           the limit may both pass; a hard bound needs a storage constraint.
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (as amended: entitlement after precondition); ADR 0215 (decisions 1 and 3); ADR 0294
 *                     (decisions 16 and 17); ADR 0270 (collaboration gated by an entitlement); ADR 0327 (decision 6:
 *                     the call's scope).
 */
import { type CallDescriptor, EntitlementCheck } from "@stackra/actions/contracts";
import { Driver, kindOf } from "@stackra/container";
import { EntitlementRequiredError } from "@stackra/errors";

import { ENTITLEMENT_REGISTRY } from "#core/constants/entitlement-registry.constant";
import { LimitReachedError } from "#core/errors/limit-reached.error";
import { EntitlementSource } from "#core/ports/entitlement-source.port";
import { EntitlementUsage } from "#core/ports/entitlement-usage.port";
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

  /**
   * @param source - the plan service's snapshot or the licence.
   * @param usage - the counter of the counted models.
   */
  constructor(source: EntitlementSource, usage: EntitlementUsage) {
    super();
    this.source = source;
    this.usage = usage;
  }

  /**
   * Resolves when the scope's plan grants every entitlement that gates `call`.
   *
   * @throws EntitlementRequiredError when a gating right is not in the plan.
   * @throws LimitReachedError when a gating limit's count already equals or passes the grant.
   * @throws TypeError when the source answers a count for a feature or module, or a boolean `true` for a limit.
   */
  async check(call: CallDescriptor): Promise<void> {
    const scope = call.scope?.id;
    for (const { type, key, gates } of ENTITLEMENT_REGISTRY.values()) {
      if (!gates.includes(call.type)) continue;
      // `Entitlement` records `counts` for a limit and only for a limit.
      const { counts } = (kindOf(type)?.options ?? {}) as unknown as EntitlementOptions;
      const grant = await this.source.grant(type, scope);
      if (grant === undefined || grant === false) throw EntitlementRequiredError.create();
      if (counts === undefined) {
        if (grant !== true)
          throw new TypeError(
            `${key} is granted or not, so its source answers a boolean, not ${grant}`,
          );
        continue;
      }
      if (typeof grant !== "number")
        throw new TypeError(`${key} is a limit, so its source answers a count, not ${grant}`);
      if (grant !== Number.POSITIVE_INFINITY && (await this.usage.count(counts(), scope)) >= grant)
        throw LimitReachedError.create({ entitlement: key, limit: grant });
    }
  }
}
