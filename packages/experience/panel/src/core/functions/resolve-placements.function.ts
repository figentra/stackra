/**
 * Stackra file contract:
 * Purpose: `resolvePlacements(placements)`, the layer rule: for each item, the placements of its highest layer replace the
 *          whole set of every lower layer's and never merge with them.
 * Boundary: pure; keeps the input order. Layers rank owner (1), host (2), edition (2b), app (3), scope copy (4), user
 *           overlay (5); layers 4 and 5 are data the caller validated. A winning placement with `slot: null` is kept, so
 *           the reader sees the item was removed.
 * Runtime: isomorphic
 * Governing contract: ADR 0306 (rules 7 and 8: five layers, replace, never merge); ADR 0336 (decision 4: layer 2b); ADR 0307 (rule 19).
 */
import { Enum } from "@stackra/contracts";

import { PlacementLayer } from "#core/enums/placement-layer.enum";

/** The rank of `layer`. */
const rankOf = (layer: PlacementLayer): number => Enum.meta(PlacementLayer, layer).rank;

/**
 * The placements of each item's highest layer.
 *
 * @example
 * resolvePlacements([
 *   { key: "loyalty_kit.points_balance", layer: PlacementLayer.Owner, slot: null },
 *   { key: "loyalty_kit.points_balance", layer: PlacementLayer.App, slot: Slots.Dashboard.Main },
 * ]); // only the App placement
 */
export function resolvePlacements<
  P extends { readonly key: string; readonly layer: PlacementLayer },
>(placements: readonly P[]): P[] {
  const top = new Map<string, number>();
  for (const placement of placements)
    top.set(placement.key, Math.max(top.get(placement.key) ?? 0, rankOf(placement.layer)));
  return placements.filter((placement) => rankOf(placement.layer) === top.get(placement.key));
}
