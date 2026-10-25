/**
 * Stackra file contract:
 * Purpose: `WidgetTree`, what `describeWidget` records for one widget class: its placement options, the layer and base of a
 *          placement, and the node its `display` returned.
 * Boundary: a type only; gen writes it into the manifest's widgets.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 5 and 14); ADR 0306 (layers).
 */
import type { AnyClass } from "@stackra/container";

import type { PlacementLayer } from "#core/enums/placement-layer.enum";
import type { DisplayNode } from "#core/types/display-node.type";
import type { WidgetOptions } from "#core/types/widget-options.type";

/** One widget, recorded. */
export interface WidgetTree {
  /** The options the class (or its placement) declared. */
  readonly options: WidgetOptions<never>;

  /** The layer the options were set in. */
  readonly layer: PlacementLayer;

  /** The widget a placement shadow placed, when this is one. */
  readonly placedFrom?: AnyClass;

  /** The recorded display. */
  readonly display: DisplayNode;
}
