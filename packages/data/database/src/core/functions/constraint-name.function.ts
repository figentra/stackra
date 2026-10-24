/**
 * Stackra file contract:
 * Purpose: `constraintName`, the ADR 0231 name of an index (`idx_`), a foreign key (`fk_`) or a check constraint
 *          (`ck_`): the prefix, the table without its schema, then the columns, joined by underscores.
 * Boundary: internal; the single source of these names, shared by the migration compiler and the ORM naming
 *           strategy so the two never disagree. A unique index is an index (`idx_`), as the migrations name it.
 * Runtime: node
 * Governing contract: ADR 0231 as amended by ADR 0294 (`idx_`, `fk_`, `ck_`).
 */
import { quoteIdentifier } from "#core/functions/quote-identifier.function";

/**
 * The name of a constraint or index on `table` over `columns`.
 *
 * @param prefix - `idx` for an index, `fk` for a foreign key, `ck` for a check constraint.
 * @param table - the table name, without its schema.
 * @throws TypeError when the name is longer than Postgres keeps (63 characters) or not snake_case.
 * @example
 * constraintName("idx", "orders", ["customer_id", "status"]); // "idx_orders_customer_id_status"
 */
export function constraintName(
  prefix: "idx" | "fk" | "ck",
  table: string,
  columns: readonly string[],
): string {
  const name = [prefix, table, ...columns].join("_");
  quoteIdentifier(name);
  return name;
}
