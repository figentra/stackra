/**
 * Stackra file contract:
 * Purpose: `totalOf`, what the provider is asked for: the amount plus the tip line, when there is one.
 * Boundary: `Money` arithmetic only, so a tip in another currency is a `RangeError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (integer minor units); XP-6 (tips).
 */
import type { Money } from "@stackra/money";

/**
 * Amount and tip together.
 *
 * @example
 * const total = totalOf({ amount, tip }); // sent to the provider
 */
export function totalOf(parts: { readonly amount: Money; readonly tip?: Money }): Money {
  return parts.tip === undefined ? parts.amount : parts.amount.plus(parts.tip);
}
