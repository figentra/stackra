/**
 * Stackra file contract:
 * Purpose: `FilterComparison`, the operator of a comparison filter (`Filter.compare("total", FilterComparison.Gte)`):
 *          greater than, at least, less than, at most, not equal.
 * Boundary: an enum (`Enum.of`); each code is the `op` the filter value carries on the wire, which
 *           `@stackra/database`'s `TableFilter` reads.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 2); ADR 0294 (decision 16: Enum); reporting gap 5.
 */
import { Enum } from "@stackra/contracts";

/**
 * The comparison a filter applies.
 *
 * @example
 * f.compare("totals.totalMinor", FilterComparison.Gte)
 */
export const FilterComparison = Enum.of({
  /** Greater than the value. */
  Gt: "gt",
  /** The value or greater. */
  Gte: "gte",
  /** Less than the value. */
  Lt: "lt",
  /** The value or less. */
  Lte: "lte",
  /** Anything but the value. */
  Ne: "ne",
});

/** One of the codes above. */
export type FilterComparison = Enum.Value<typeof FilterComparison>;
