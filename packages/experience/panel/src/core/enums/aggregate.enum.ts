/**
 * Stackra file contract:
 * Purpose: `Aggregate`, how a saved view totals a column per group: a count of rows, or the sum, average, minimum or
 *          maximum of a number.
 * Boundary: an enum (`Enum.of`) written in a saved view's `totals`; `groupRows` applies it.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 14: grouping, sub-grouping and totals); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * How a total column folds its rows.
 *
 * @example
 * { totals: [{ key: "totals.totalMinor", aggregate: Aggregate.Sum }] }
 */
export const Aggregate = Enum.of({
  /** The rows in the group. */
  Count: "count",
  /** The sum of the number. */
  Sum: "sum",
  /** The mean of the number. */
  Average: "average",
  /** The least number. */
  Min: "min",
  /** The greatest number. */
  Max: "max",
});

/** One of the codes above. */
export type Aggregate = Enum.Value<typeof Aggregate>;
