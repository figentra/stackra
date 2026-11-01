/**
 * Stackra file contract:
 * Purpose: `staleAllowListEntries(root, allowed?, pending?)`, the exempt names (either list) that no longer match a
 *          duplicate, so the lists can shrink (moved from `tools/scripts/duplicate-exports.mjs`).
 * Boundary: reads the workspace sources; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0305; stackra-224 (STA-1382); rule-gap N-6.
 */
import { ALLOWED } from "#node/duplicate-exports/constants/allowed.constant";
import { PENDING } from "#node/duplicate-exports/constants/pending.constant";
import { duplicateExports } from "#node/duplicate-exports/functions/duplicate-exports.function";
import { sorted } from "#node/functions/sorted.function";

/**
 * The exempt names without a duplicate, sorted.
 *
 * @param root - the workspace root.
 * @param allowed - the intended copies; `ALLOWED` by default.
 * @param pending - the copies another batch removes; `PENDING` by default.
 * @example
 * staleAllowListEntries(root, ALLOWED, {}); // ["gone"]
 */
export function staleAllowListEntries(
  root: string,
  allowed: Readonly<Record<string, string>> = ALLOWED,
  pending: Readonly<Record<string, string>> = PENDING,
): string[] {
  const duplicates = duplicateExports(root);
  return sorted(
    [...Object.keys(allowed), ...Object.keys(pending)].filter((name) => !duplicates.has(name)),
  );
}
