/**
 * Stackra file contract:
 * Purpose: `checkWranglerOperationalKeys`, ADR 0519 enforcement (STA-1989): a member's `wrangler.jsonc` holds code
 *          facts only; every operational key (`WRANGLER_OPERATIONAL_KEYS`) is a finding, except in the baseline files.
 * Boundary: pure apart from `read`. A file that does not parse as JSONC is a finding.
 * Runtime: node
 * Governing contract: ADR 0519 (decision 1).
 */
import { WRANGLER_OPERATIONAL_KEYS } from "#node/constants/wrangler-operational-keys.constant";
import { stripJsonc } from "#node/functions/strip-jsonc.function";

/**
 * The findings of one `wrangler.jsonc`.
 *
 * @param path - repository-relative.
 * @param text - its source.
 * @example
 * checkWranglerOperationalKeys("workers/x/wrangler.jsonc", '{ "workers_dev": false }'); // one finding
 */
export function checkWranglerOperationalKeys(path: string, text: string): string[] {
  let config: unknown;
  try {
    config = JSON.parse(stripJsonc(text));
  } catch (error) {
    return [`${path}: not valid JSONC (${(error as Error).message})`];
  }
  if (typeof config !== "object" || config === null) return [];
  return WRANGLER_OPERATIONAL_KEYS.filter((key) => key in config).map(
    (key) =>
      `${path}: "${key}" is an operational setting; set it in the member's runway.yaml (ADR 0519)`,
  );
}
