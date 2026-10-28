/**
 * Stackra file contract:
 * Purpose: `TableCount`, the row count a table read returns when it asks for one (`table(input, { count })`).
 * Boundary: a type only. A capped count draws as "10,000+": `value` is the cap and `estimate` the planner's guess of
 *           all matching rows.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 12); reporting gap 6.
 */

/** How many rows a table's filters match. */
export interface TableCount {
  /** The rows counted: every match, or the cap when `capped`. */
  readonly value: number;

  /** Whether more rows match than the cap; the list shows `value` followed by "+". */
  readonly capped: boolean;

  /** The planner's estimate of every matching row, present when `capped`. */
  readonly estimate?: number;
}
