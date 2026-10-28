/**
 * Stackra file contract:
 * Purpose: `Count`, how a table read counts its rows: `table(input, { count: Count.Estimated })`, and the mode a
 *          resource table records (`t.count(Count.Exact)`; `@stackra/panel` re-exports it).
 * Boundary: an enum (`Enum.of`). Estimated counts exactly up to `BULK_LIMITS.countCap` rows and past it reports the cap
 *           ("10,000+") with the planner's estimate; exact counts every row, for a small table where the number matters.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 12: estimated counts; the count lives in `@stackra/database`); ADR 0294
 *                     (decision 16: Enum); reporting gap 6.
 */
import { Enum } from "@stackra/contracts";

/**
 * How a table's rows are counted.
 *
 * @example
 * await orders.table(input, { count: Count.Estimated }); // { ..., count: { value: 10000, capped: true, estimate: 48210 } }
 */
export const Count = Enum.of({
  /** Exact up to the cap, then capped with the planner's estimate; the default, cheap on any table. */
  Estimated: "estimated",
  /** A real count, for a small table where the number matters. */
  Exact: "exact",
});

/** One of the codes above. */
export type Count = Enum.Value<typeof Count>;
