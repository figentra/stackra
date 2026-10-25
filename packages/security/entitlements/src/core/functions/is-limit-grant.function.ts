/**
 * Stackra file contract:
 * Purpose: `isLimitGrant`, whether a source's answer is a usable limit grant: a count of zero or more, or a soft limit
 *          whose allowance and ceiling are counts and whose grace end is a valid date.
 * Boundary: pure; used to refuse a malformed grant as a source bug before it can allow anything.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decisions 3 and 4).
 */
import type { LimitGrant } from "#contracts/types/limit-grant.type";

/** A count of zero or more (infinity allowed). */
const isCount = (value: unknown): value is number =>
  typeof value === "number" && !Number.isNaN(value) && value >= 0;

/**
 * Whether `grant` is a limit grant.
 *
 * @example
 * if (!isLimitGrant(grant)) throw new TypeError("a limit's source answers a count");
 */
export function isLimitGrant(grant: unknown): grant is number | LimitGrant {
  if (isCount(grant)) return true;
  if (typeof grant !== "object" || grant === null) return false;
  const { limit, ceiling, graceEndsAt } = grant as Partial<LimitGrant>;
  return (
    isCount(limit) &&
    (ceiling === undefined || isCount(ceiling)) &&
    (graceEndsAt === undefined ||
      (graceEndsAt instanceof Date && !Number.isNaN(graceEndsAt.getTime())))
  );
}
