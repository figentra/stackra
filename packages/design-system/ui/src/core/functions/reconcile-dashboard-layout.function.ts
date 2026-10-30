/**
 * Stackra file contract:
 * Purpose: `reconcileDashboardLayout`, a saved dashboard layout made safe against today's tiles: the saved order and
 *          sizes for every tile that still exists, then each tile added since in its default place at the end.
 * Boundary: pure. The saved value comes from storage, so it is checked entry by entry: anything that is not a known
 *           tile with a known size is dropped, and a value that is not a list yields the defaults.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decision 18); ADR 0305 (one declaration per file); STA-1371.
 */
import { WidgetSize } from "#contracts/enums/widget-size.enum";
import type { DashboardLayout } from "#contracts/types/dashboard-layout.type";
import type { DashboardTile } from "#contracts/types/dashboard-tile.type";

/**
 * The saved layout kept to the tiles of `defaults`.
 * @param saved - the layout loaded from storage, of unknown shape
 * @param defaults - every tile the dashboard has today, in its default order and sizes
 * @returns the reader's layout: saved tiles first, in their saved order, then the new ones
 * @example
 * reconcileDashboardLayout([{ id: "b", size: "full" }], [{ id: "a", size: "small" }, { id: "b", size: "small" }]);
 * // [{ id: "b", size: "full" }, { id: "a", size: "small" }]
 */
export function reconcileDashboardLayout(
  saved: unknown,
  defaults: DashboardLayout,
): DashboardLayout {
  if (!Array.isArray(saved)) return defaults;
  const known = new Set(defaults.map((tile) => tile.id));
  const kept: DashboardTile[] = [];
  for (const entry of saved as unknown[]) {
    const tile = entry as Partial<DashboardTile> | null;
    if (
      typeof tile?.id === "string" &&
      known.has(tile.id) &&
      (WidgetSize as readonly unknown[]).includes(tile.size) &&
      !kept.some((other) => other.id === tile.id)
    )
      kept.push({ id: tile.id, size: tile.size as WidgetSize });
  }
  return [...kept, ...defaults.filter((tile) => !kept.some((other) => other.id === tile.id))];
}
