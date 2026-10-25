/**
 * Stackra file contract:
 * Purpose: `WidgetPlaceOptions`, what `Widget.place(Base, { ... })` may change: the slot, order, size and params, and the
 *          layer the placement is set in.
 * Boundary: a type only; a placement never changes the query or the display. `slot: null` removes the item. The layer is
 *           the host module's by default; gen sets the edition's (2b) or the app's (3) from the file's place.
 * Runtime: isomorphic
 * Governing contract: ADR 0306 (rules 6 to 8 and the layer table); ADR 0336 (decision 4: layer 2b).
 */
import type { PlacementLayer } from "#core/enums/placement-layer.enum";
import type { WidgetSize } from "#core/enums/widget-size.enum";
import type { SlotRef } from "#core/types/slot-ref.type";

/** What a placement may change. */
export interface WidgetPlaceOptions {
  /** The slot, or `null` to remove the item. */
  readonly slot?: SlotRef | null;

  /** The position among the slot's widgets. */
  readonly order?: number;

  /** The width on a grid. */
  readonly size?: WidgetSize;

  /** Fixed query input. */
  readonly params?: Readonly<Record<string, unknown>>;

  /** The layer: a host module, an edition's modules or the app's overrides tree. */
  readonly layer?:
    | typeof PlacementLayer.Host
    | typeof PlacementLayer.Edition
    | typeof PlacementLayer.App;
}
