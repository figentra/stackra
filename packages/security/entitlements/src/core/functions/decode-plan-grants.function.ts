/**
 * Stackra file contract:
 * Purpose: `decodePlanGrants`, the port form of a plan service's wire grants: a flag stays a flag, a count stays a
 *          count, `null` is no limit (`Infinity`), and a soft limit keeps its grace end as a `Date` and its ceiling.
 * Boundary: pure. A value that is none of those is refused, never guessed.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decisions 1 and 3); ADR 0242 (decision 2: seats).
 */
import type { LimitGrant } from "#contracts/types/limit-grant.type";

/** The count of a wire value: `null` is no limit. */
const count = (value: unknown, key: string): number => {
  if (value === null) return Number.POSITIVE_INFINITY;
  if (typeof value !== "number") throw new TypeError(`grant ${key} has no count`);
  return value;
};

/**
 * The port form of `wire`.
 *
 * @throws TypeError when a value is not a wire grant.
 * @example
 * decodePlanGrants({ storage_gb: null, sso: true }); // { storage_gb: Infinity, sso: true }
 */
export function decodePlanGrants(
  wire: Readonly<Record<string, unknown>>,
): Readonly<Record<string, boolean | number | LimitGrant>> {
  const grants: Record<string, boolean | number | LimitGrant> = {};
  for (const [key, value] of Object.entries(wire)) {
    if (typeof value === "boolean") grants[key] = value;
    else if (value === null || typeof value === "number") grants[key] = count(value, key);
    else if (typeof value === "object" && !Array.isArray(value)) {
      const { limit, graceEndsAt, ceiling } = value as Record<string, unknown>;
      grants[key] = {
        limit: count(limit, key),
        ...(typeof graceEndsAt === "string" ? { graceEndsAt: new Date(graceEndsAt) } : {}),
        ...(typeof ceiling === "number" ? { ceiling } : {}),
      };
    } else throw new TypeError(`grant ${key} is not a grant`);
  }
  return Object.freeze(grants);
}
