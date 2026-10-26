/**
 * Stackra file contract:
 * Purpose: `widgetsFor(slots)`, the registered widgets a page renders in `slots`: layers resolved, only those whose display
 *          the slot's place takes, by order then key.
 * Boundary: internal: reads the table `registerWidgets` filled; the web dashboard and the native slot import it by path.
 *           The permission gate is the caller's, because it needs the session.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 18 and 19); ADR 0306 (rules 7 and 8).
 */
import { Enum } from "@stackra/contracts";

import { WIDGET_REGISTRY } from "#core/constants/widget-registry.constant";
import type { DisplayKind } from "#core/enums/display-kind.enum";
import { Place } from "#core/enums/place.enum";
import { resolvePlacements } from "#core/functions/resolve-placements.function";
import type { SlotRef } from "#core/types/slot-ref.type";
import type { WidgetDescriptor } from "#core/types/widget-descriptor.type";

/**
 * The widgets placed in `slots`.
 *
 * @example
 * widgetsFor([Slots.Dashboard.Main]).map((widget) => widget.key);
 */
export function widgetsFor(slots: readonly SlotRef[]): WidgetDescriptor[] {
  const places = new Map(slots.map((slot) => [slot.key, slot.place]));
  return resolvePlacements(WIDGET_REGISTRY)
    .filter((widget) => {
      const place = widget.slot === null ? undefined : places.get(widget.slot.key);
      if (place === undefined) return false;
      const displays: readonly DisplayKind[] = Enum.meta(Place, place).displays;
      return displays.includes(widget.display.kind);
    })
    .sort((left, right) => left.order - right.order || left.key.localeCompare(right.key));
}
