/**
 * Stackra file contract:
 * Purpose: `QueryGuard`, how the database watches its statements (`DatabaseConfig.queries`): the duration from which a
 *          statement is logged as slow, how many times one statement shape may run in one call before it is reported
 *          as an N+1 loop, and whether a call that goes over fails instead of warning.
 * Boundary: a type only. Values come from configuration; `strict` is for tests and development, never production.
 * Runtime: isomorphic
 * Governing contract: data-layer gaps scale-performance 7 and 8 (stackra-282, STA-1400).
 */
import type { Duration } from "@stackra/contracts";

/** The query guard. */
export interface QueryGuard {
  /** A statement that takes this long or longer is logged as slow (`LoggerQueryObserverDriver`). */
  readonly slow: Duration;

  /** How many times one statement shape may run in one call; one more is reported as an N+1 loop. */
  readonly repeats: number;

  /** Fail a call that goes over its `queryBudget` or `repeats` (tests, development) instead of warning. */
  readonly strict: boolean;
}
