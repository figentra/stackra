/**
 * Stackra file contract:
 * Purpose: `DatabasePool`, the connection pool one service instance holds to its database (`DatabaseConfig.pool`,
 *          `DatabaseOptions.pool`): at most `max` connections, at least `min` kept open, how long an idle one stays, how
 *          long a transaction waits for its place in the connection gate, and how deep a chain of connections the gate
 *          keeps places for.
 * Boundary: a type only. Values come from configuration; the boot sets `max` from the instance's share of the
 *           service's runway `poolBudget` (`DATABASE_POOL_MAX`) when the deploy hands it over (ADR 0473).
 * Runtime: isomorphic
 * Governing contract: ADR 0473 (decisions 1 and 2, and the 2026-11-26 note: the gate); ADR 0238; STA-1716.
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

  /**
   * How long a transaction waits for its place in the connection gate before it is refused as retryable
   * (`ConnectionPoolExhaustedError`). Default 30 seconds.
   */
  readonly acquireTimeout?: Duration | undefined;

  /**
   * The deepest chain of connections one unit holds at once: a call's isolation transaction and the `requiresNew`
   * store it opens is two. The gate keeps one place per level below the top, so `max - (nesting - 1)` units run at
   * once and a chain no deeper than this always finishes; one deeper than `max` is refused at once. Default 4.
   */
  readonly nesting?: number | undefined;
}
