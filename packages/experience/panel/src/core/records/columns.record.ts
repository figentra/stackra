/**
 * Stackra file contract:
 * Purpose: `ColumnsRecord<R>`, what a columns callback receives: the runtime side of `ColumnFactory<R>`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it. Shared by the table and the relations builders.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1 and 11).
 */
import { Column } from "#core/constants/column.constant";
import { ColumnRecord } from "#core/records/column.record";
import type { BindRef } from "#core/types/bind-ref.type";
import type { ColumnFactory } from "#core/types/column-factory.type";
import type { Path } from "#core/types/path.type";

/** Builds columns over row type `R`. */
export class ColumnsRecord<R> implements ColumnFactory<R> {
  /** A column rendered from the field's type. */
  from(key: Path<R>): ColumnRecord {
    return new ColumnRecord((flags) => Column.from(key, flags));
  }

  /** A principal column. */
  principal(key: Path<R>): ColumnRecord {
    return new ColumnRecord((flags) => Column.principal(key, flags));
  }

  /** A money column in the currency at `options.currency`. */
  money(key: Path<R>, options: { readonly currency: Path<R> | BindRef }): ColumnRecord {
    return new ColumnRecord((flags) => Column.money(key, { ...flags, currency: options.currency }));
  }

  /** The length of a list field. */
  count(key: Path<R>): ColumnRecord {
    return new ColumnRecord((flags) => Column.count(key, flags));
  }
}
