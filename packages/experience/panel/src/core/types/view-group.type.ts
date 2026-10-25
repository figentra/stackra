/**
 * Stackra file contract:
 * Purpose: `ViewGroup<R>`, one group of rows `groupRows` makes: the value the rows share, how many there are, the
 *          totals, and either the rows or the sub-groups.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 14).
 */

/** One group of rows. */
export interface ViewGroup<R> {
  /** The value of the grouping path the rows share; `null` for rows without one. */
  readonly value: unknown;

  /** The rows in the group, sub-groups included. */
  readonly count: number;

  /** Each total by `<aggregate>:<key>`; `null` when no row holds a number there. */
  readonly totals: Readonly<Record<string, number | null>>;

  /** The rows, in their order, when the view has no sub-group. */
  readonly rows?: readonly R[];

  /** The sub-groups, when the view has one. */
  readonly groups?: readonly ViewGroup<R>[];
}
