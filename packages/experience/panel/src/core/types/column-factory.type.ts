/**
 * Stackra file contract:
 * Purpose: `ColumnFactory<R>`, what the columns callback receives: one method per way a column renders.
 * Boundary: a type only; every key is a path of the row `R`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1 and 13).
 */
import type { BindRef } from "#core/types/bind-ref.type";
import type { ColumnBuilder } from "#core/types/column-builder.type";
import type { Path } from "#core/types/path.type";

/** Builds the columns of a table over row type `R`. */
export interface ColumnFactory<R> {
  /** A column rendered from the field's type (an enum renders its badge). */
  from(key: Path<R>): ColumnBuilder;

  /** A principal id rendered as an avatar and a name. */
  principal(key: Path<R>): ColumnBuilder;

  /** Minor units rendered as money in the currency at `currency` (a row path or a bind). */
  money(key: Path<R>, options: { readonly currency: Path<R> | BindRef }): ColumnBuilder;

  /** The length of a list field. */
  count(key: Path<R>): ColumnBuilder;
}
