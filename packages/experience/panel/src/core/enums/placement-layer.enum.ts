/**
 * Stackra file contract:
 * Purpose: `PlacementLayer`, the layers a placement is set in, lowest first, with each layer's rank as case data: the
 *          owner's file, a host module, an edition's modules (2b), the app's overrides, a scope node's copy and the
 *          user's overlay.
 * Boundary: an enum (`Enum.of`). For one item, the placements of a higher layer replace the whole set of a lower one and
 *           never merge (`resolvePlacements`). Layers 1 to 3 (and 2b) are code gen checks; layers 4 and 5 are data.
 * Runtime: isomorphic
 * Governing contract: ADR 0306 (rules 7 and 8: five layers); ADR 0336 (decision 4: layer 2b for an edition's modules); ADR 0307
 *                     (rule 19); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * A placement layer.
 *
 * @example
 * Enum.meta(PlacementLayer, PlacementLayer.Edition).rank; // 25, between Host (20) and App (30)
 */
export const PlacementLayer = Enum.of({
  /** The owner's own declaration (the widget file's slot, order and size). */
  Owner: ["1", { rank: 10 }],
  /** A host module's `Widget.place(Base, ...)`. */
  Host: ["2", { rank: 20 }],
  /** An edition's modules, placing into the base product's slots. */
  Edition: ["2b", { rank: 25 }],
  /** The app's `src/overrides/<owner>/` tree; `slot: null` removes the item. */
  App: ["3", { rank: 30 }],
  /** A scope node's saved copy of a layout (data). */
  Scope: ["4", { rank: 40 }],
  /** The user's overlay, within what the scope's copy leaves unlocked (data). */
  User: ["5", { rank: 50 }],
});

/** One of the codes above. */
export type PlacementLayer = Enum.Value<typeof PlacementLayer>;
