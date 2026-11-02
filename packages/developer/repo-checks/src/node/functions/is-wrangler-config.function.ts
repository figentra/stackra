/**
 * Stackra file contract:
 * Purpose: `isWranglerConfig(path)`, whether a path is a member's `wrangler.jsonc` that is not in the baseline.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0519; STA-1989.
 */
import { WRANGLER_OPERATIONAL_BASELINE } from "#node/constants/wrangler-operational-baseline.constant";

/**
 * True for a `wrangler.jsonc` the check applies to.
 *
 * @param path - repository-relative.
 * @example
 * isWranglerConfig("workers/new/wrangler.jsonc"); // true
 */
export function isWranglerConfig(path: string): boolean {
  return /(^|\/)wrangler\.jsonc$/.test(path) && !WRANGLER_OPERATIONAL_BASELINE.has(path);
}
