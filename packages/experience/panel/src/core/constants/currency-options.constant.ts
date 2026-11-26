/**
 * Stackra file contract:
 * Purpose: `CURRENCY_OPTIONS`, the ISO 4217 codes a currency form field offers, each as its own label.
 * Boundary: internal; the runtime's `Intl.supportedValuesOf("currency")`, read once.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (money in minor units).
 */

/** The ISO 4217 codes a currency field offers. */
export const CURRENCY_OPTIONS: readonly { readonly id: string; readonly label: string }[] =
  Intl.supportedValuesOf("currency").map((id) => ({ id, label: id }));
