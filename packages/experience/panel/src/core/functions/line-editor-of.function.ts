/**
 * Stackra file contract:
 * Purpose: `lineEditorOf(slot, placements)`, the one line editor a `LineEntry` slot shows: the placement into that slot
 *          at the highest layer, so an edition's editor (layer 2b) replaces the base's (layer 1) and never sits beside
 *          it.
 * Boundary: pure. Two editors at the winning layer is a build fault gen reports; here it throws, so a page never shows
 *           two editors for one document. A slot with no editor gives `undefined`.
 * Runtime: isomorphic
 * Governing contract: ADR 0350 (decision 6: exactly one line editor); ADR 0306 (rules 7 and 8: replace, never merge).
 */
import { Enum } from "@stackra/contracts";

import { PlacementLayer } from "#core/enums/placement-layer.enum";
import type { LineEditorPlacement } from "#core/types/line-editor-placement.type";

/**
 * The editor `slot` shows.
 *
 * @throws RangeError when two editors share the highest layer of the slot.
 * @example
 * lineEditorOf("sales.order.lines", placements)?.key; // "retail.size_grid" when the edition placed it
 */
export function lineEditorOf<P extends LineEditorPlacement>(
  slot: string,
  placements: readonly P[],
): P | undefined {
  const rank = (placement: P): number => Enum.meta(PlacementLayer, placement.layer).rank;
  const mine = placements.filter((placement) => placement.slot === slot);
  const top = Math.max(...mine.map(rank));
  const winners = mine.filter((placement) => rank(placement) === top);
  if (winners.length > 1)
    throw new RangeError(
      `lineEditorOf: "${slot}" has ${winners.length} line editors at one layer (${winners.map((w) => w.key).join(", ")})`,
    );
  return winners[0];
}
