/**
 * Stackra file contract:
 * Purpose: `TableFilter`, the closed vocabulary of one filter value in a table read: a value (equal), a list (any of
 *          its items), or an operator object: `range` (inclusive bounds), `dateRange` (from inclusive, to exclusive, or
 *          a named relative range such as `last_7_days`), a comparison (`gt`, `gte`, `lt`, `lte`, `ne`), `contains`
 *          (case-insensitive substring, served by a pg_trgm index) and `isNull`.
 * Boundary: a type only; the wire form a list input carries under `filter.<path>`. `CrudService.table` compiles it with
 *           `filterCondition`, which refuses any other object, so no ORM operator reaches the query from a caller.
 *           An operand is a scalar (string, number, boolean, bigint or Date), never an object.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 2: filter is a typed object of the declared filters); reporting gap 5.
 */

/** A scalar operand. */
type Operand = string | number | boolean | bigint | Date;

/** One filter value of a table read. */
export type TableFilter =
  | Operand
  | null
  | readonly Operand[]
  | { readonly op: "range"; readonly from?: Operand; readonly to?: Operand }
  | {
      readonly op: "dateRange";
      /** The first instant inside; a date-only `YYYY-MM-DD` is that day's start. */
      readonly from?: string | Date;
      /** The first instant after; a date-only `YYYY-MM-DD` is inclusive (the range ends after that day). */
      readonly to?: string | Date;
      /** A named range (`today`, `yesterday`, `last_7_days`, `last_30_days`, `this_month`); wins over the bounds. */
      readonly range?: string;
    }
  | { readonly op: "gt" | "gte" | "lt" | "lte" | "ne"; readonly value: Operand }
  | { readonly op: "contains"; readonly value: string }
  | { readonly op: "isNull"; readonly value: boolean };
