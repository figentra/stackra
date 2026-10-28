/**
 * Stackra file contract:
 * Purpose: `TableOptions<M>`, what a list query adds to a table read: the rows it may see (a customer sees their own),
 *          the relations to load with each row, how a named date range resolves (`ctx.period`), and whether to count the
 *          matching rows.
 * Boundary: a type only. Without `period`, a `dateRange` filter that names a relative range is refused, because only
 *           the call knows its clock and time zone.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 2: `CrudService.table(input, { where })`); reporting gaps 5 (relative ranges)
 *                     and 6 (counts).
 */
import type { FindOptions } from "@mikro-orm/core";
import type { Period, PeriodInput } from "@stackra/actions";

import type { Where } from "#contracts/types/where.type";
import type { Count } from "#core/enums/count.enum";

/** The table read options. */
export interface TableOptions<M extends object, H extends string = never> {
  /** The rows the caller may see, added to the input's filters. */
  readonly where?: Where<M>;

  /** The relations loaded with each row. */
  readonly populate?: FindOptions<M, H>["populate"];

  /** Resolves a named date range in the call's clock and time zone; a list query passes `ctx.period`. */
  readonly period?: (input: PeriodInput) => Period;

  /** Counts the rows the filters match (`Count.Estimated` caps at 10,000); absent, the page carries no count. */
  readonly count?: Count;
}
