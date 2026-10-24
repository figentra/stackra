/**
 * Stackra file contract:
 * Purpose: the direction of a sort: a table column's default sort, a list query's order and a cursor's order.
 * Boundary: an `Enum.of` value plus the type of the same name; the code is the wire value of a sort parameter.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16), ADR 0307 (resource tables), ADR 0231 (snake_case codes).
 */
import { Enum } from "#core/bases/enum.base";

/** Ascending or descending. */
export const SortDirection = Enum.of({
  /** Smallest, earliest or A first. */
  Asc: "asc",
  /** Largest, latest or Z first. */
  Desc: "desc",
});

/** One of the codes above. */
export type SortDirection = Enum.Value<typeof SortDirection>;
