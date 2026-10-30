/**
 * Stackra file contract:
 * Purpose: `listCellCurrency(item, column, record, currencyPath)`, the currency a list entry's cell is money in: a
 *          `…Minor` column (`valueMinor`, `totals.totalMinor`) takes the `currency` beside it in the item, else the
 *          record's currency at `currencyPath`; any other column, or no currency found, is not money.
 * Boundary: internal; pure. Minor units are named `…Minor` by the house rule, so the column name says it is money; the
 *           list entry names no money columns of its own. Web and native View pages share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1: wire paths); ADR 0164.
 */
import { valueAt } from "#core/functions/value-at.function";

/**
 * The currency code of `column` in `item`, or undefined when the cell is not money.
 *
 * @example
 * listCellCurrency({ valueMinor: 1250 }, "valueMinor", { currency: "SAR" }, "currency"); // "SAR"
 */
export function listCellCurrency(
  item: object,
  column: string,
  record: object,
  currencyPath: string | undefined,
): string | undefined {
  if (!column.endsWith("Minor")) return undefined;
  const dot = column.lastIndexOf(".");
  const own = valueAt(item, dot < 0 ? "currency" : `${column.slice(0, dot)}.currency`);
  if (typeof own === "string") return own;
  const shared = currencyPath === undefined ? undefined : valueAt(record, currencyPath);
  return typeof shared === "string" ? shared : undefined;
}
