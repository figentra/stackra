/**
 * Stackra file contract:
 * Purpose: `minorUnitScale(currency)`, how many minor units make one major unit of an ISO 4217 currency (100 for SAR,
 *          1 for JPY, 1000 for KWD), so a money input shows major units and stores minor ones.
 * Boundary: internal; pure. Reads the currency's fraction digits from `Intl`; an unknown code throws a RangeError.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (form keys are input paths); house rule: money travels in minor units (`…Minor`).
 */

/**
 * The minor units in one major unit of `currency`.
 *
 * @example
 * minorUnitScale("SAR"); // 100
 */
export function minorUnitScale(currency: string): number {
  const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
    .maximumFractionDigits;
  return 10 ** (digits ?? 2);
}
