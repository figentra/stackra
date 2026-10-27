/**
 * Stackra file contract:
 * Purpose: `HealthCheck`, an Integration's `health` option: how often the scheduled health check calls each
 *          connection's `check()`, and after how many failures in a row the connection is reported unhealthy.
 * Boundary: a type only; the schedule is run by the scheduler from what gen records, and the check is the
 *           connection's own `check()` (ADR 0308 rule 14), never a declarative test request.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 14);
 *                     owner D10 2026-10-28 (stackra-223: `Duration` replaced `Interval`).
 */
import type { Duration } from "@stackra/contracts";

/**
 * The scheduled health check.
 *
 * @example
 * health: { every: Duration.hours(6), failAfter: 3 }
 */
export interface HealthCheck {
  /** How often each connection is checked. */
  readonly every: Duration;

  /** Consecutive failures before the connection is reported unhealthy; 1 when left out. */
  readonly failAfter?: number;
}
