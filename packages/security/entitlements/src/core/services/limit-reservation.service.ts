/**
 * Stackra file contract:
 * Purpose: `LimitReservationService`, reserve-then-commit for a limit: holds a lock on the limit's key in the scope,
 *          checks the grant and the current count under it (only the records the limit's `where` filter keeps), runs the create (the commit) and releases, so two creates
 *          racing at the limit can never both pass.
 * Boundary: built on `@stackra/locking`'s `Locks` (one lease per limit and scope, waiting at most the hold TTL) and the
 *           same `EntitlementSource` and `EntitlementUsage` the pipeline's step reads. The create must make the record
 *           countable before it returns (inside its own transaction), or the next holder counts too few. Soft limits
 *           and grace follow `limitAllows`. A limit outside the plan refuses `entitlement_required`.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decisions 3 and 4); owner round 3 #18 (fix the race: reserve-then-commit);
 *                     STA-913 (the `where` filter).
 */
import { kindOf, Service } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { Duration, type PublicId } from "@stackra/contracts";
import { EntitlementRequiredError } from "@stackra/errors";
import type { Locks } from "@stackra/locking";

import type { EntitlementSource } from "#contracts/ports/entitlement-source.port";
import type { EntitlementUsage } from "#contracts/ports/entitlement-usage.port";
import { LimitReachedError } from "#core/errors/limit-reached.error";
import { entitlementKey } from "#core/functions/entitlement-key.function";
import { isLimitGrant } from "#core/functions/is-limit-grant.function";
import { limitAllows } from "#core/functions/limit-allows.function";
import { limitOf } from "#core/functions/limit-of.function";
import type { EntitlementClass } from "#core/types/entitlement-class.type";
import type { EntitlementOptions } from "#core/types/entitlement-options.type";

/**
 * Serialises creates at a limit.
 *
 * @example
 * const product = await reservations.reserve(ProductLimitEntitlement, scope.id, () => products.create(input));
 */
export class LimitReservationService extends Service {
  /** Where grants come from. */
  private readonly source: EntitlementSource;

  /** Where counts come from. */
  private readonly usage: EntitlementUsage;

  /** The lock store. */
  private readonly locks: Locks;

  /** The time a grace period ends against. */
  private readonly clock: Clock;

  /**
   * @param source - the plan's grants.
   * @param usage - the counter of the counted models.
   * @param locks - the configured lock store.
   * @param clock - the current time.
   */
  constructor(source: EntitlementSource, usage: EntitlementUsage, locks: Locks, clock: Clock) {
    super();
    this.source = source;
    this.usage = usage;
    this.locks = locks;
    this.clock = clock;
  }

  /**
   * Runs `create` only when one more of `entitlement`'s counted model fits `scope`'s plan, holding the limit's lock
   * from the count until `create` ends.
   *
   * @param hold - how long the lock lives without renewal, and the longest wait for it.
   * @throws EntitlementRequiredError when the limit is not in the plan.
   * @throws LimitReachedError when no more fit; `create` did not run.
   * @throws TypeError when `entitlement` is not a limit, or the source answers a grant that is not a limit grant.
   * @throws LockUnavailableError when another holder kept the lock for the whole wait.
   */
  reserve<T>(
    entitlement: EntitlementClass,
    scope: PublicId | undefined,
    create: () => Promise<T>,
    hold: Duration = Duration.seconds(30),
  ): Promise<T> {
    const key = entitlementKey(entitlement);
    const { counts, where } = (kindOf(entitlement)?.options ?? {}) as unknown as EntitlementOptions;
    if (counts === undefined) throw new TypeError(`${key} is not a limit entitlement`);
    return this.locks.with(`entitlements:${key}:${scope ?? "platform"}`, hold, async () => {
      const grant = await this.source.grant(entitlement, scope);
      if (grant === undefined || grant === false) throw EntitlementRequiredError.create();
      if (!isLimitGrant(grant))
        throw new TypeError(`${key} is a limit, so its source answers a count, not ${grant}`);
      if (limitOf(grant) !== Number.POSITIVE_INFINITY) {
        const count = await this.usage.count(counts(), scope, where);
        if (!limitAllows(grant, count, this.clock.now()))
          throw LimitReachedError.create({ entitlement: key, limit: limitOf(grant) });
      }
      return create();
    });
  }
}
