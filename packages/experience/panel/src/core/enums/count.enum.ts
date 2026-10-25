/**
 * Stackra file contract:
 * Purpose: `Count`, how a resource table counts its rows.
 * Boundary: an enum (`Enum.of`); a table is estimated unless it says otherwise, and an estimated filtered count shows
 *           capped ("10,000+").
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 12: estimated counts); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * How a table's rows are counted.
 *
 * @example
 * t.columns(...).count(Count.Exact)
 */
export const Count = Enum.of({
  /** From the planner's estimate; the default, cheap on any table. */
  Estimated: "estimated",
  /** A real count, for a small table where the number matters. */
  Exact: "exact",
});

/** One of the codes above. */
export type Count = Enum.Value<typeof Count>;
