/**
 * Stackra file contract:
 * Purpose: `loweredBaselines(root, baseline?)`, the packages below their `any` baseline, as `dir: count < baseline`,
 *          so the baseline can only shrink (moved from `tools/scripts/any-ratchet.mjs`).
 * Boundary: reads the workspace sources and, by default, the committed baseline; writes nothing.
 * Runtime: node
 * Governing contract: rule-gap list N-5 (owner D11, 2026-10-28); STA-1388.
 */
import { anyDisableCounts } from "#node/any-ratchet/functions/any-disable-counts.function";
import { readBaseline } from "#node/any-ratchet/functions/read-baseline.function";
import { sorted } from "#node/functions/sorted.function";

/**
 * The packages whose baseline can be lowered.
 *
 * @param root - the workspace root.
 * @param baseline - package directory to allowed count; the committed file by default.
 * @example
 * loweredBaselines(root, { "packages/data/model": 3 }); // ["packages/data/model: 1 < 3"]
 */
export function loweredBaselines(
  root: string,
  baseline: Readonly<Record<string, number>> = readBaseline(root),
): string[] {
  const counts = anyDisableCounts(root);
  return sorted(
    Object.entries(baseline)
      .filter(([dir, allowed]) => (counts.get(dir) ?? 0) < allowed)
      .map(([dir, allowed]) => `${dir}: ${counts.get(dir) ?? 0} < ${allowed}`),
  );
}
