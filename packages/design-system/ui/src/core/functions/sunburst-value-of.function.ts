/**
 * Stackra file contract:
 * Purpose: `sunburstValueOf`, a sunburst slice's size: its own value, or the sum of its children's.
 * Boundary: pure; negative children count as zero.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { SunburstItem } from "#contracts/types/sunburst-item.type";

/**
 * The size of `item`.
 * @example sunburstValueOf({ key: "a", label: "A", children: [{ key: "b", label: "B", value: 2 }] }); // 2
 */
export function sunburstValueOf(item: SunburstItem): number {
  return (
    item.value ??
    (item.children ?? []).reduce((sum, child) => sum + Math.max(0, sunburstValueOf(child)), 0)
  );
}
