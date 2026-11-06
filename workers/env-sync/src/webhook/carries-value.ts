/**
 * Stackra file contract:
 * Purpose: `carriesValue(payload)`, whether a parsed webhook payload holds a key that would carry a secret value
 *          (`value`, `secretValue`, `secrets`, any case), at any depth, in an object or an array.
 * Boundary: pure; reads the parsed JSON only.
 * Runtime: worker
 * Governing contract: ADR 0173 (amendment of 2026-11-04, decision 6: metadata only, never a value).
 */
import { VALUE_KEYS } from "#src/constants";

/**
 * True when `payload` has a value key anywhere.
 *
 * @example
 * carriesValue({ project: { secrets: [] } }); // true
 */
export function carriesValue(payload: unknown): boolean {
  if (Array.isArray(payload)) return payload.some(carriesValue);
  if (typeof payload !== "object" || payload === null) return false;
  return Object.entries(payload).some(
    ([key, child]) => VALUE_KEYS.has(key.toLowerCase()) || carriesValue(child),
  );
}
