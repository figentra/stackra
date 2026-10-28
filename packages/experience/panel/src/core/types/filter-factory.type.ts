/**
 * Stackra file contract:
 * Purpose: `FilterFactory<R>`, what the filters callback receives: a filter per field, a principal picker, the trashed
 *          filter.
 * Boundary: a type only; every key is a path of the row `R`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 2: filter is a typed object of the declared filters).
 */
import type { FilterBuilder } from "#core/types/filter-builder.type";
import type { Path } from "#core/types/path.type";

/** Builds the filters of a table over row type `R`. */
export interface FilterFactory<R> {
  /** A filter rendered from the field's type (an enum offers its codes, a date a range). */
  from: (key: Path<R>) => FilterBuilder;

  /** A principal picker. */
  principal: (key: Path<R>) => FilterBuilder;

  /** With, without or only soft-deleted records. */
  trashed: () => FilterBuilder;
}
