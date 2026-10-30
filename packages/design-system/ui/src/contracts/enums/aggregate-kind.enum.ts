/**
 * Stackra file contract:
 * Purpose: the aggregates a `DataTable` column can total: `sum`, `avg`, `min`, `max` and `count`.
 * Boundary: the values only; `aggregateOf` computes them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); product audit 2026-10-28 (DataTable variants).
 */

/** The aggregates of a column. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128).
export const AggregateKind = Object.freeze(["sum", "avg", "min", "max", "count"] as const);

/** One way to fold a column into a single value. */
export type AggregateKind = (typeof AggregateKind)[number];
