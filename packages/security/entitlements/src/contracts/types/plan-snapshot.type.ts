/**
 * Stackra file contract:
 * Purpose: `PlanSnapshot`, the effective plan of one scope as the plan service composes it (plan, add-ons, overrides,
 *          trials): the grant of each entitlement by its locked key and the allowance of each seat kind by its key.
 * Boundary: a type only. The keys and the values are catalogue data (`plan-catalogue:<product>`): seat kinds such as a
 *           provider seat or a support seat are records, never code. A key absent here is not in the plan.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decisions 1, 3 and 5); ADR 0242 (decision 2: seats); owner XP-1 (seat kinds).
 */
import type { LimitGrant } from "#contracts/types/limit-grant.type";

/** One scope's plan. */
export interface PlanSnapshot {
  /** Rises with every change of the plan. */
  readonly version: number;

  /** Entitlement key (`catalogue.product_limit`) to its grant: a boolean, a count or a soft limit. */
  readonly grants: Readonly<Record<string, boolean | number | LimitGrant>>;

  /** Seat kind key (`provider`, `support`) to its allowance: a count or a soft limit. */
  readonly seats: Readonly<Record<string, number | LimitGrant>>;
}
