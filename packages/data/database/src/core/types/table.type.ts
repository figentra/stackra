/**
 * Stackra file contract:
 * Purpose: `Table<C>`, a generated table constant: its schema-qualified name and one `ColumnRef` per field (a `Money`
 *          field has one per part), so raw SQL never types a table or column name.
 * Boundary: a type only; `table(name, columns)` builds the value.
 * Runtime: node
 * Governing contract: ADR 0160 (decision 1); ADR 0294 (decision 20: tables in the module schema).
 */
import type { ColumnRef } from "#core/values/column-ref.value";

/** A table constant of the column map `C`. */
export interface Table<
  C extends Readonly<Record<string, string | Readonly<Record<string, string>>>>,
> {
  /** The schema-qualified name (`orders.orders`). */
  readonly name: string;

  /** The module's Postgres schema (`orders`). */
  readonly schema: string;

  /** The table name inside the schema (`orders`). */
  readonly table: string;

  /** One column reference per field; a multi-column field maps each part. */
  readonly columns: {
    readonly [F in keyof C]: C[F] extends string
      ? ColumnRef
      : { readonly [P in keyof C[F]]: ColumnRef };
  };
}
