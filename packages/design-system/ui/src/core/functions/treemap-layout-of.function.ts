/**
 * Stackra file contract:
 * Purpose: `treemapLayoutOf`, the squarified layout of a treemap: each positive item's box as percentages of the plot,
 *          largest first, rows laid along the plot's shorter side so tiles stay close to square.
 * Boundary: pure. `x` is measured from the reading start, so a renderer places it with `start` and Arabic mirrors.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same layout on web and native); STA-1371.
 */
import type { TreemapTile } from "#core/types/treemap-tile.type";
import type { TreemapItem } from "#contracts/types/treemap-item.type";

/** The worst aspect ratio of a row of `areas` laid along a side of `side`. */
function worst(areas: readonly number[], side: number): number {
  const sum = areas.reduce((total, area) => total + area, 0);
  const max = Math.max(...areas);
  const min = Math.min(...areas);
  return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
}

/**
 * The tiles of `items`, largest first unless `isOrdered`, in a plot `aspect` times as wide as it is tall (percent units on both axes).
 * @example treemapLayoutOf([{ key: "a", label: "A", value: 1 }], 2); // [{ x: 0, y: 0, width: 100, height: 100, ... }]
 */
export function treemapLayoutOf(
  items: readonly TreemapItem[],
  aspect = 1,
  isOrdered = false,
): TreemapTile[] {
  // Largest first gives the squarest tiles; `isOrdered` keeps a caller's sort (smallest first, by label) instead.
  const kept = items.map((item, index) => ({ item, index })).filter(({ item }) => item.value > 0);
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const entries = isOrdered ? kept : kept.sort((a, b) => b.item.value - a.item.value);
  const total = entries.reduce((sum, { item }) => sum + item.value, 0);
  if (total === 0) return [];
  // Work in a box `aspect` wide and 1 tall, so squareness is judged in real proportions, then scale to percent.
  let box = { x: 0, y: 0, width: aspect, height: 1 };
  const scale = (aspect * 1) / total;
  const tiles: TreemapTile[] = [];
  let row: typeof entries = [];
  const layRow = (members: typeof entries) => {
    const areas = members.map(({ item }) => item.value * scale);
    const sum = areas.reduce((a, b) => a + b, 0);
    const isVertical = box.width >= box.height;
    const thickness = sum / (isVertical ? box.height : box.width);
    let offset = 0;
    members.forEach((member, position) => {
      const length = (areas[position] ?? 0) / thickness;
      const rect = isVertical
        ? { x: box.x, y: box.y + offset, width: thickness, height: length }
        : { x: box.x + offset, y: box.y, width: length, height: thickness };
      offset += length;
      tiles.push({
        item: member.item,
        index: member.index,
        x: (rect.x / aspect) * 100,
        y: rect.y * 100,
        width: (rect.width / aspect) * 100,
        height: rect.height * 100,
      });
    });
    box = isVertical
      ? { x: box.x + thickness, y: box.y, width: box.width - thickness, height: box.height }
      : { x: box.x, y: box.y + thickness, width: box.width, height: box.height - thickness };
  };
  for (const entry of entries) {
    const side = Math.min(box.width, box.height);
    const areas = row.map(({ item }) => item.value * scale);
    const next = [...areas, entry.item.value * scale];
    if (row.length === 0 || worst(next, side) <= worst(areas, side)) row.push(entry);
    else {
      layRow(row);
      row = [entry];
    }
  }
  if (row.length > 0) layRow(row);
  return tiles;
}
