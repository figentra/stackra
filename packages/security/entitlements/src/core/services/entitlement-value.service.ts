/**
 * Stackra file contract:
 * Purpose: `EntitlementValueService`, how code reads a value entitlement (ADR 0408): the plain number the scope's
 *          effective plan sets for it, such as the audit visible window in days, counting no model.
 * Boundary: reads the bound `EntitlementSource` only, so the number is plan data (the plan service composes the
 *           effective set: plan, add-ons, overrides, trials) and never a constant in code. `undefined` means the plan
 *           does not set it, and the caller decides what that means (usually: the feature is not available). A class
 *           that is not a value entitlement, or a source answer that is not a number, throws a `TypeError`, never a
 *           guessed number.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decisions 1 and 5); ADR 0408; STA-824.
 */
import { kindOf, Service } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import type { EntitlementSource } from "#contracts/ports/entitlement-source.port";
import { EntitlementKind } from "#core/enums/entitlement-kind.enum";
import { entitlementKey } from "#core/functions/entitlement-key.function";
import { isValueGrant } from "#core/functions/is-value-grant.function";
import type { EntitlementClass } from "#core/types/entitlement-class.type";
import type { EntitlementOptions } from "#core/types/entitlement-options.type";

/**
 * Reads value entitlements from the effective plan.
 *
 * @example
 * const days = await values.valueOf(AuditWindowDaysEntitlement, scope.id); // 90, or undefined outside the plan
 */
export class EntitlementValueService extends Service {
  /** Where grants come from. */
  private readonly source: EntitlementSource;

  /**
   * @param source - the plan's grants (the plan snapshot in SaaS, the licence on-prem).
   */
  constructor(source: EntitlementSource) {
    super();
    this.source = source;
  }

  /**
   * The number `entitlement` is set to in `scope`'s plan, or `undefined` when the plan does not set it.
   *
   * @param scope - the id of the scope; `undefined` for the platform-wide plan.
   * @throws TypeError when `entitlement` is not a value entitlement, or its source answers something other than a
   *         number of zero or more.
   * @throws Error when the source cannot be reached.
   */
  override async valueOf(
    entitlement: EntitlementClass,
    scope: PublicId | undefined,
  ): Promise<number | undefined> {
    const key = entitlementKey(entitlement);
    const { kind } = (kindOf(entitlement)?.options ?? {}) as unknown as EntitlementOptions;
    if (kind !== EntitlementKind.Value) throw new TypeError(`${key} is not a value entitlement`);
    const grant = await this.source.grant(entitlement, scope);
    if (grant === undefined) return undefined;
    if (!isValueGrant(grant))
      throw new TypeError(
        `${key} is a value, so its source answers a number, not ${JSON.stringify(grant)}`,
      );
    return grant;
  }
}
