/**
 * Stackra file contract:
 * Purpose: `MoneyValueContractProps`, the props of every runtime's `MoneyValue`: an amount in a currency, written the
 *          locale's way (symbol position, spacing) in the customer's digits.
 * Boundary: types only; the amount is in major units (riyals, not halalas). For exact minor-unit maths use
 *           `@stackra/money` and pass its decimal.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0192; STA-1371 (wave A).
 */

/** Props shared by the web and native `MoneyValue`. */
export interface MoneyValueContractProps {
  /** The amount, in major units. */
  readonly amount: number;
  /** The ISO 4217 code, such as "SAR" or "AED". */
  readonly currency: string;
  /** `symbol` (the default), `narrowSymbol`, `code` or `name`. */
  readonly currencyDisplay?: Intl.NumberFormatOptions["currencyDisplay"] | undefined;
  /** True for a compact amount, such as "SAR 1.2M". */
  readonly isCompact?: boolean | undefined;
}
