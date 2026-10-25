/**
 * Stackra file contract:
 * Purpose: `LimitGrant`, a limit with soft enforcement: the plan's allowance, and an optional grace period during which
 *          creates past the allowance still pass, up to an optional hard ceiling.
 * Boundary: a type only, the richer form of a numeric limit grant. The numbers and the date are plan-catalogue data
 *           (the plan service composes them, a plan change sets the grace); nothing here picks a value. Past
 *           `graceEndsAt`, or with no grace at all, the allowance is a hard limit.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decisions 3 and 4: hard, soft and grace); owner round 3 #18.
 */

/** A soft limit. */
export interface LimitGrant {
  /** How many the plan allows; `Number.POSITIVE_INFINITY` for no limit. */
  readonly limit: number;

  /** While before this instant, creates past `limit` still pass (the over-limit grace). */
  readonly graceEndsAt?: Date;

  /** The most a grace period lets exist; absent for no ceiling during grace. */
  readonly ceiling?: number;
}
