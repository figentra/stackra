/**
 * Stackra file contract:
 * Purpose: `isMoneyAmount(value)`, whether a value is a money object (`@stackra/money`'s `MoneyAmount`): integer minor
 *          units and a currency code.
 * Boundary: internal: pure; recognises the shape, so the panel needs no dependency on `@stackra/money`.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (money in minor units); ADR 0307 (rule 1).
 */

/**
 * Whether `value` is a money object.
 *
 * @example
 * isMoneyAmount({ minor: 1250, currency: "AED" }); // true
 */
export function isMoneyAmount(
  value: unknown,
): value is { readonly minor: number; readonly currency: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    Number.isInteger((value as { readonly minor?: unknown }).minor) &&
    typeof (value as { readonly currency?: unknown }).currency === "string"
  );
}
