/**
 * Stackra file contract:
 * Purpose: `bulletScaleOf`, a bullet chart row in percent of its scale: the scale runs from zero to the largest of its
 *          band edges, value and target, so nothing overflows; each band spans from the previous edge to its own.
 * Boundary: pure. Negative values are drawn as zero; no bands give one band over the whole scale.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same scale on web and native); STA-1371.
 */
import type { BulletItem } from "#contracts/types/bullet-item.type";
import type { BulletScale } from "#core/types/bullet-scale.type";

/**
 * The row on its scale.
 * @example bulletScaleOf({ key: "a", label: "A", value: 60, target: 80, ranges: [50, 100] });
 * // { bands: [{ from: 0, to: 50 }, { from: 50, to: 100 }], value: 60, target: 80 }
 */
export function bulletScaleOf(item: BulletItem): BulletScale {
  const ranges = (item.ranges ?? []).filter((edge) => Number.isFinite(edge) && edge > 0);
  const end = Math.max(...ranges, item.value, item.target ?? 0, 0);
  const percent = (figure: number) =>
    end > 0 ? (Math.min(Math.max(figure, 0), end) / end) * 100 : 0;
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const edges = [...ranges].sort((a, b) => a - b);
  if (edges.at(-1) !== end) edges.push(end);
  return {
    bands: edges.map((edge, index) => ({
      from: percent(edges[index - 1] ?? 0),
      to: percent(edge),
    })),
    value: percent(item.value),
    target: item.target === undefined ? null : percent(item.target),
  };
}
