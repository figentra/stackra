/**
 * Stackra file contract:
 * Purpose: `D1Statement`: A prepared D1 statement.
 * Boundary: types only. Each interface is a subset of the platform's; never add a member the Worker does not call.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 3).
 */

/** A prepared D1 statement. */
export interface D1Statement {
  /** Binds the positional parameters of the statement. */
  bind: (...values: readonly (string | number | null)[]) => D1Statement;
  /** Runs the statement and resolves to its first row, or null when it returns none. */
  first: <T>() => Promise<T | null>;
  /** Runs the statement and resolves to every row it returns. */
  all: <T>() => Promise<{ results: T[] }>;
  /** Runs the statement for its effect and ignores any rows. */
  run: () => Promise<unknown>;
}
