/**
 * Stackra file contract:
 * Purpose: `table(name, columns)`, how a generated `#stackra/tables` file declares a model's table constant: the
 *          schema-qualified name and the column of each field.
 * Boundary: called by generated code; checks every name once and freezes the result.
 * Runtime: node
 * Governing contract: ADR 0160 (decision 1); ADR 0294 (decision 20); ADR 0231.
 */
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import type { Table } from "#core/types/table.type";
import { ColumnRef } from "#core/values/column-ref.value";

/**
 * A table constant.
 *
 * @throws TypeError when `name` is not `<schema>.<table>` in snake_case, or a column name is not snake_case.
 * @example
 * export const Orders = table("orders.orders", {
 *   id: "id",
 *   total: { minor: "total_minor", currency: "total_currency" },
 * });
 * Orders.columns.total.minor.name; // "total_minor"
 */
export function table<
  const C extends Readonly<Record<string, string | Readonly<Record<string, string>>>>,
>(name: string, columns: C): Table<C> {
  const [schema = "", local = "", ...rest] = name.split(".");
  if (rest.length > 0) throw new TypeError(`"${name}" is not <schema>.<table>`);
  quoteIdentifier(schema);
  quoteIdentifier(local);
  const refs: Record<string, ColumnRef | Readonly<Record<string, ColumnRef>>> = {};
  for (const [field, column] of Object.entries(columns))
    refs[field] =
      typeof column === "string"
        ? new ColumnRef(name, column)
        : Object.freeze(
            Object.fromEntries(
              Object.entries(column).map(([part, value]) => [part, new ColumnRef(name, value)]),
            ),
          );
  return Object.freeze({
    name,
    schema,
    table: local,
    columns: Object.freeze(refs),
  }) as unknown as Table<C>;
}
