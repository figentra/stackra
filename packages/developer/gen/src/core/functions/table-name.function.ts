/**
 * Stackra file contract:
 * Purpose: `tableName`, the table of a model: snake_case and plural, in the module's Postgres schema
 *          (`orders.order_lines`), so two modules may each own a model of the same name.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: model table; one Postgres schema per module); ADR 0238.
 */
import { plural } from "#core/functions/plural.function";
import { snakeCase } from "#core/functions/snake-case.function";

/**
 * The schema-qualified table of a model class.
 *
 * @example
 * tableName("orders", "OrderLine"); // "orders.order_lines"
 */
export function tableName(module: string, className: string): string {
  return `${module}.${plural(snakeCase(className))}`;
}
