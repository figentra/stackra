/**
 * Stackra file contract:
 * Purpose: `ColumnRef`, one column of a generated table constant (`StockLevels.columns.onHand`): the `sql` tag writes
 *          it as a quoted identifier, never as a parameter.
 * Boundary: a value; made only by `table(...)`, so a column name in SQL always comes from gen's constants.
 * Runtime: node
 * Governing contract: ADR 0160 (decision 1: no hand-typed names in raw SQL); ADR 0231.
 */
import { quoteIdentifier } from "#core/functions/quote-identifier.function";

/**
 * A column of a table.
 *
 * @example
 * sql`${StockLevels.columns.onHand} - ${StockLevels.columns.reserved} <= ${threshold}`;
 */
export class ColumnRef {
  /** The schema-qualified table (`inventory.stock_levels`). */
  readonly table: string;

  /** The column name (`on_hand`). */
  readonly name: string;

  /**
   * @param table - the schema-qualified table.
   * @param name - the column name, snake_case.
   * @throws TypeError for a column name that is not snake_case.
   */
  constructor(table: string, name: string) {
    quoteIdentifier(name);
    this.table = table;
    this.name = name;
  }

  /** The quoted column name. */
  toString(): string {
    return quoteIdentifier(this.name);
  }
}
