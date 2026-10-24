/**
 * Stackra file contract:
 * Purpose: `HealthCheck`, an Integration's `health` option: how often the scheduled health check calls each
 *          connection's `check()`, and after how many failures in a row the connection is reported unhealthy.
 * Boundary: a type only; the schedule is run by the scheduler from what gen records, and the check is the
 *           connection's own `check()` (ADR 0308 rule 14), never a declarative test request.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 14).
 */
import type { Interval } from "#core/types/interval.type";

/**
 * The scheduled health check.
 *
 * @example
 * health: { every: "6h", failAfter: 3 }
 */
export interface HealthCheck {
  /** How often each connection is checked. */
  readonly every: Interval;

  /** Consecutive failures before the connection is reported unhealthy; 1 when left out. */
  readonly failAfter?: number;
}
