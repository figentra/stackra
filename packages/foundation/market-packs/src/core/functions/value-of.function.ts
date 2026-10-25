/**
 * Stackra file contract:
 * Purpose: `valueOf`, the answer to "the value of X for market M on date D", with the market and pack version that set
 *          it.
 * Boundary: pure; `undefined` when no layer has the key in force that day. See `valuesOn` for the overlay rule.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 5).
 */
import { valuesOn } from "#core/functions/values-on.function";
import type { ResolvedPack } from "#core/types/resolved-pack.type";
import type { ResolvedValue } from "#core/types/resolved-value.type";

/**
 * The value of `key` in `resolved` on `on`.
 *
 * @example
 * valueOf(resolved, "consumer.withdrawal_days", "2026-07-01")?.value;
 */
export function valueOf(
  resolved: ResolvedPack,
  key: string,
  on: string,
): ResolvedValue | undefined {
  return valuesOn(resolved, on).get(key);
}
