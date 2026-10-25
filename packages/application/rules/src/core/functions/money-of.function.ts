/**
 * Stackra file contract:
 * Purpose: `moneyOf(value)`, the `Money` a money operand holds: `{ minor, currency }` as JSON, or `undefined` when the
 *          value is not one.
 * Boundary: internal to the package; the shape is `@stackra/money`'s wire form (`money()`), so a condition stores an
 *           amount exactly as an action input carries one.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (money in minor units); ADR 0331 (decision 3).
 */
import { Money } from "@stackra/money";

import { isRecord } from "#core/functions/is-record.function";

/** The amount, or `undefined` for anything but a safe-integer minor amount in an ISO 4217 currency. */
export function moneyOf(value: unknown): Money | undefined {
  if (
    !isRecord(value, ["minor", "currency"]) ||
    typeof value["minor"] !== "number" ||
    typeof value["currency"] !== "string"
  )
    return undefined;
  try {
    return Money.ofMinor(value["minor"], value["currency"]);
  } catch {
    return undefined;
  }
}
