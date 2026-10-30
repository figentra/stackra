/**
 * Stackra file contract:
 * Purpose: `currencyFractionDigitsOf(currency)`, the number of minor-unit digits of an ISO 4217 currency as `Intl`
 *          knows it: 2 for SAR and USD, 3 for KWD and BHD, 0 for JPY. MoneyField scales its minor-unit value by it.
 * Boundary: pure; an unknown code makes `Intl` throw a RangeError, which reaches the caller.
 * Runtime: isomorphic
 * Governing contract: gap inventory row 2 (owner decision 2026-10-28, "P1 + P2 core"); ADR 0302 (decision 3).
 */

/** The minor-unit digits of `currency`, for example 3 for "KWD". */
export function currencyFractionDigitsOf(currency: string): number {
  return (
    new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
      .maximumFractionDigits ?? 2
  );
}
