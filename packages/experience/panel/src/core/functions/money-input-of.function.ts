/**
 * Stackra file contract:
 * Purpose: `moneyInputOf(schema, key, record)`, how a minor-unit form field is entered: against the currency beside it
 *          in the input (a `MoneyAmount`, a list row's `priceMinor` and `currency`), else in major units of the
 *          record's known currency, else as it travels (undefined).
 * Boundary: internal: pure; the web and native form fields draw the money field it names.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (money in minor units); ADR 0307 (form keys are paths of the input).
 */
import type { ZodType } from "zod";

import { currencyScale } from "#core/functions/currency-scale.function";
import { inputKind } from "#core/functions/input-kind.function";
import { listCellCurrency } from "#core/functions/list-cell-currency.function";

/**
 * The money entry of the field at `key`.
 *
 * @example
 * moneyInputOf(CreateOrderAction.input, "totals.totalMinor", undefined); // { currencyPath: "totals.currency" }
 */
export function moneyInputOf(
  schema: ZodType,
  key: string,
  record: object | undefined,
):
  | { readonly currencyPath: string }
  | { readonly currency: string; readonly scale: number }
  | undefined {
  // `totals.totalMinor` and `cost.minor` sit beside `totals.currency` and `cost.currency`.
  const beside = `${key.slice(0, key.lastIndexOf(".") + 1)}currency`;
  if (inputKind(schema, beside).kind !== "missing") return { currencyPath: beside };
  // Money travels in minor units; with a known currency it is entered in major units.
  const currency = listCellCurrency(record ?? {}, key, record ?? {}, "currency");
  const scale = currencyScale(currency);
  return currency === undefined || scale === undefined ? undefined : { currency, scale };
}
