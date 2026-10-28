/**
 * Stackra file contract:
 * Purpose: `QuerySample`, what a `QueryObserver` is told about one statement the ORM ran: its normalised shape (no
 *          parameter values), verb and table, how long it took, the rows it read or wrote, whether it failed, and
 *          whether it ran on a read replica.
 * Boundary: a type only; plain data, safe to log. The statement is the shape `statementShape` returns: every literal
 *           and bound value is `?` and an `in (...)` list is one `?`, so no person's data reaches a log or a span.
 * Runtime: isomorphic
 * Governing contract: data-layer gap scale-performance 7 (stackra-282, STA-1400); ADR 0147 (decision 3: ids and codes,
 *                     no values).
 */

/** One statement the ORM ran. */
export interface QuerySample {
  /** The normalised statement: literals and bound values are `?`, whitespace is collapsed. */
  readonly statement: string;

  /** The statement's first keyword in lower case (`select`, `insert`, `update`, `delete`, `with`). */
  readonly verb: string;

  /** The first table it names after `from`, `into` or `update`, as written (`schema.table` kept); absent when none. */
  readonly table?: string;

  /** How long it took in milliseconds, as the ORM measured it. */
  readonly durationMs: number;

  /** The rows it returned or changed, when the driver reported them. */
  readonly rows?: number;

  /** Whether it failed. */
  readonly failed: boolean;

  /** Whether it ran on a read replica. */
  readonly replica: boolean;
}
