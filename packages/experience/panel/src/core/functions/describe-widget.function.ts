/**
 * Stackra file contract:
 * Purpose: `describeWidget(Widget)`, what gen records for one widget class: its options, the layer they were set in, the
 *          widget a placement shadow placed, and the node its `display` returns, run once on a fresh builder.
 * Boundary: pure: `display` runs on an object with the class's prototype, so no constructor runs; a placement shadow keeps
 *           its base's display (a placement never changes it).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 5 and 14); ADR 0306 (rules 6 to 8).
 */
import { kindOf, type AnyClass } from "@stackra/container";

import type { WidgetBase } from "#core/bases/widget-base.base";
import { PlacementLayer } from "#core/enums/placement-layer.enum";
import { DisplayRecord } from "#core/records/display.record";
import type { WidgetOptions } from "#core/types/widget-options.type";
import type { WidgetTree } from "#core/types/widget-tree.type";

/**
 * The recorded tree of `type`.
 *
 * @throws TypeError when `type` is not a widget class.
 * @example
 * describeWidget(OrderKpisWidget).display.kind; // "kpi_group"
 */
export function describeWidget(type: AnyClass): WidgetTree {
  const record = kindOf(type);
  if (record?.kind !== "widget")
    throw new TypeError(`describeWidget: ${type.name} does not extend Widget<Query>({ ... })`);
  const { layer, placedFrom, ...options } = record.options as {
    readonly layer?: PlacementLayer;
    readonly placedFrom?: AnyClass;
  } & Readonly<Record<string, unknown>>;
  const self = Object.create(type.prototype as object) as WidgetBase<object>;
  return Object.freeze({
    options: Object.freeze(options) as WidgetOptions<never>,
    layer: layer ?? PlacementLayer.Owner,
    ...(placedFrom === undefined ? {} : { placedFrom }),
    display: self.display(new DisplayRecord<never>()).toNode(),
  });
}
