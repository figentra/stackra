/**
 * Stackra file contract:
 * Purpose: `DatabasePool`, the connection pool one service instance holds to its database (`DatabaseConfig.pool`,
 *          `DatabaseOptions.pool`): at most `max` connections, at least `min` kept open, and how long an idle one stays.
 * Boundary: a type only. Values come from configuration; the boot sets `max` from the instance's share of the
 *           service's runway `poolBudget` (`DATABASE_POOL_MAX`) when the deploy hands it over (ADR 0473).
 * Runtime: isomorphic
 * Governing contract: ADR 0473 (decisions 1 and 2); ADR 0238.
 */
import type { Duration } from "@stackra/contracts";

/** The pool of one instance. */
export interface DatabasePool {
  /** The most connections this instance opens to its database (the primary, and each replica). */
  readonly max: number;

  /** The connections kept open while idle. */
  readonly min: number;

  /** How long an idle connection above `min` stays open before the pool closes it. */
  readonly idleTimeout: Duration;
}
