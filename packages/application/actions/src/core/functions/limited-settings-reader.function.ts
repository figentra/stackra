/**
 * Stackra file contract:
 * Purpose: `limitedSettingsReader(reads, source)`, the settings reader of an `ApprovalCondition`: it forwards only the
 *          keys in `reads` to `source` and throws on any other key.
 * Boundary: pure over its arguments. `reads` is the condition's static list; `source` is the platform's settings read
 *           that gen wires in. The reader keeps no state and caches nothing, so a threshold change applies at once.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (limited reads, N2); STA-1724 FR-002.
 */
import type { ApprovalSettingsReader } from "#core/types/approval-settings-reader.type";

/**
 * A reader over `source` for the `reads` keys only.
 *
 * @example
 * const settings = limitedSettingsReader(["billing.coupon.maxPercent"], (key) => resolver.get(key));
 * await settings.get("billing.coupon.maxPercent"); // the value
 * await settings.get("billing.other"); // throws RangeError
 */
export function limitedSettingsReader(
  reads: readonly string[],
  source: (key: string) => Promise<unknown>,
): ApprovalSettingsReader {
  const allowed = new Set(reads);
  return {
    async get(key: string): Promise<unknown> {
      if (!allowed.has(key))
        throw new RangeError(
          `An approval condition may read only its declared keys (${[...allowed].join(", ")}), not ${JSON.stringify(key)}`,
        );
      return source(key);
    },
  };
}
