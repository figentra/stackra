/**
 * Stackra file contract:
 * Purpose: `sunburstLayoutOf`, the slices of a sunburst chart as arcs: each ring splits its parent's angle by value,
 *          clockwise from the top, and each slice keeps its top slice's position for its colour.
 * Boundary: pure. A slice's value is its own or its children's sum; zero and negative slices are left out.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same layout on web and native); STA-1371.
 */
import type { SunburstItem } from "#contracts/types/sunburst-item.type";
import { sunburstValueOf } from "#core/functions/sunburst-value-of.function";
import type { SunburstArc } from "#core/types/sunburst-arc.type";

/**
 * The arcs of `items`, top slices first, then each ring outwards in order.
 * @example sunburstLayoutOf([{ key: "a", label: "A", value: 1 }]); // [{ depth: 0, start: 0, end: 2π, ... }]
 */
export function sunburstLayoutOf(items: readonly SunburstItem[]): SunburstArc[] {
  const arcs: SunburstArc[] = [];
  const walk = (
    level: readonly SunburstItem[],
    start: number,
    span: number,
    total: number,
    depth: number,
    branch: number,
    trail: readonly string[],
    keys: readonly string[],
  ) => {
    let at = start;
    level.forEach((item, index) => {
      const value = sunburstValueOf(item);
      if (value <= 0 || total <= 0) return;
      const sweep = (value / total) * span;
      const own = depth === 0 ? index : branch;
      const path = [...trail, item.label];
      const ids = [...keys, item.key];
      arcs.push({
        item,
        depth,
        start: at,
        end: at + sweep,
        value,
        branch: own,
        trail: path,
        keys: ids,
      });
      // A parent larger than its children leaves the rest of its angle empty.
      if (item.children?.length) walk(item.children, at, sweep, value, depth + 1, own, path, ids);
      at += sweep;
    });
  };
  const total = items.reduce((sum, item) => sum + Math.max(0, sunburstValueOf(item)), 0);
  walk(items, 0, Math.PI * 2, total, 0, 0, [], []);
  return arcs;
}
