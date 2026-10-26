/**
 * Stackra file contract:
 * Purpose: `PlanTier`, one tier of a product's plan catalogue (Starter, Pro, Business, Enterprise): its rank and what
 *          it grants: features, limits on cost drivers, seats per kind and included modules.
 * Boundary: a type only; catalogue data. A limit of `Number.POSITIVE_INFINITY` (`null` in a seed row) is unlimited.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 1); ADR 0215 (decisions 1 and 3); config-model section 2.
 */

/** A tier. */
export interface PlanTier {
  /** The tier's key (`pro`). */
  readonly key: string;

  /** Its place in the upgrade path; higher is richer. */
  readonly rank: number;

  /** Feature entitlement keys the tier includes. */
  readonly features: readonly string[];

  /** Limit entitlement key to its allowance. */
  readonly limits: Readonly<Record<string, number>>;

  /** Seat kind key to the seats included. */
  readonly seats: Readonly<Record<string, number>>;

  /** Module keys the tier includes. */
  readonly modules: readonly string[];
}
