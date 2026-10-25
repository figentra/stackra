/**
 * Stackra file contract:
 * Purpose: `limitOf`, the number a refusal names for a limit grant: the count itself, or a soft limit's allowance.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decision 3).
 */
import type { LimitGrant } from "#contracts/types/limit-grant.type";

/**
 * The allowance of `grant`.
 *
 * @example
 * throw LimitReachedError.create({ entitlement: key, limit: limitOf(grant) });
 */
export function limitOf(grant: number | LimitGrant): number {
  return typeof grant === "number" ? grant : grant.limit;
}
