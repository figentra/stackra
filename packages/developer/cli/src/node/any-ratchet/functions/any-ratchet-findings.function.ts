/**
 * Stackra file contract:
 * Purpose: `anyRatchetFindings(root, baseline?)`, the `any` ratchet findings: one per package with more
 *          `no-explicit-any` disable comments than its baseline allows (moved from `tools/scripts/any-ratchet.mjs`).
 * Boundary: reads the workspace sources and, by default, the committed baseline; writes nothing.
 * Runtime: node
 * Governing contract: rule-gap list N-5 (owner D11, 2026-10-28); STA-1388; ADR 0129.
 */
import { BASELINE_FILE } from "#node/any-ratchet/constants/baseline-file.constant";
import { anyDisableCounts } from "#node/any-ratchet/functions/any-disable-counts.function";
import { readBaseline } from "#node/any-ratchet/functions/read-baseline.function";
import type { DirFinding } from "#node/types/dir-finding.type";

/**
 * One finding per package above its baseline.
 *
 * @param root - the workspace root.
 * @param baseline - package directory to allowed count; the committed file by default, tests pass their own.
 * @example
 * anyRatchetFindings(root, { "packages/data/model": 2 }); // []
 */
export function anyRatchetFindings(
  root: string,
  baseline: Readonly<Record<string, number>> = readBaseline(root),
): DirFinding[] {
  return [...anyDisableCounts(root)]
    .filter(([dir, count]) => count > (baseline[dir] ?? 0))
    .map(([dir, count]) => ({
      dir,
      text:
        `${count} \`no-explicit-any\` disable comments, above the baseline of ${baseline[dir] ?? 0} in ` +
        `${BASELINE_FILE}: type the value (unknown, a generic or a named type) instead of adding a disable`,
    }));
}
