/**
 * Stackra file contract:
 * Purpose: `limitAllows`, whether one more record fits a limit grant: under a count, below it; under a soft limit,
 *          below the allowance, or past it while the grace period runs and the count is below the ceiling.
 * Boundary: pure: the time is a parameter. It never decides a number; the grant is plan data.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decisions 3 and 4: hard, soft and grace); owner round 3 #18.
 */
import type { LimitGrant } from "#contracts/types/limit-grant.type";

/**
 * Whether a create may add one more to `count`.
 *
 * @example
 * limitAllows({ limit: 5, graceEndsAt: renewal, ceiling: 7 }, 5, clock.now()); // true until the renewal
 */
export function limitAllows(grant: number | LimitGrant, count: number, at: Date): boolean {
  if (typeof grant === "number") return count < grant;
  if (count < grant.limit) return true;
  if (grant.graceEndsAt === undefined || at.getTime() >= grant.graceEndsAt.getTime()) return false;
  return grant.ceiling === undefined || count < grant.ceiling;
}
