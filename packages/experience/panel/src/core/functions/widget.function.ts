/**
 * Stackra file contract:
 * Purpose: `widget(Widget, options)`, what gen calls in a member's widget table: one placed widget with its key, query,
 *          display, placement, refresh, gate, renderer and layer, as the web dashboard and the native slot read it.
 * Boundary: pure; returns a frozen descriptor. Values a generated widget ref carries as statics (key, query, display, size,
 *           ranges, range) are read from it unless given; the refresh events default to the query's `invalidateOn`.
 *           `registerWidgets` makes a table visible to the slots.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14 and 17 to 19); ADR 0306 (layers); ADR 0336 (decision 4: layer 2b); ADR 0164.
 */
import type { QueryRef } from "@stackra/clients";
import type { AnyClass } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { duration } from "@stackra/validation";

import { PlacementLayer } from "#core/enums/placement-layer.enum";
import { WidgetSize } from "#core/enums/widget-size.enum";
import { widgetTitle } from "#core/functions/widget-title.function";
import type { DisplayNode } from "#core/types/display-node.type";
import type { WidgetDescriptor } from "#core/types/widget-descriptor.type";
import type { WidgetDescriptorOptions } from "#core/types/widget-descriptor-options.type";

/** A widget key. */
const KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/** The shortest refresh interval (ADR 0164, 0294 note). */
const MIN_REFRESH_MS = 30_000;

/** What a generated widget ref carries as statics. */
interface WidgetStatics {
  readonly key?: string;
  readonly query?: QueryRef;
  readonly options?: Readonly<Record<string, unknown>> & {
    readonly display?: DisplayNode;
    readonly size?: WidgetSize;
  };
}

/**
 * The descriptor of `type` placed as `options` says.
 *
 * @throws TypeError when no key, query or display is given or carried by `type`.
 * @throws RangeError when `refreshEvery` is under 30 seconds.
 * @example
 * export const widgets = [
 *   widget(OrderKpisWidget, { slot: Slots.Dashboard.Header, order: 10, permission: OrderPermissions.read }),
 * ] as const;
 */
export function widget(type: AnyClass, options: WidgetDescriptorOptions = {}): WidgetDescriptor {
  const statics = type as unknown as WidgetStatics;
  const carried = statics.options ?? {};
  const key = options.key ?? statics.key;
  if (key === undefined || !KEY.test(key))
    throw new TypeError(
      `widget: ${type.name} needs its <module>.<name> key, got ${JSON.stringify(key)}`,
    );
  const query = options.query ?? statics.query;
  if (query === undefined) throw new TypeError(`widget: ${key} needs the query it runs`);
  const display = options.display ?? carried.display;
  if (display === undefined) throw new TypeError(`widget: ${key} needs its display`);
  let refreshEveryMs: number | undefined;
  if (options.refreshEvery !== undefined) {
    refreshEveryMs = Duration.toMilliseconds(duration(options.refreshEvery));
    if (!(refreshEveryMs >= MIN_REFRESH_MS))
      throw new RangeError(
        `widget: ${key} refreshes at least every 30 seconds, got "${options.refreshEvery}"`,
      );
  }
  const ranges =
    options.ranges ?? (carried["ranges"] as WidgetDescriptor["ranges"] | undefined) ?? [];
  const range = options.range ?? (carried["range"] as WidgetDescriptor["range"]);
  return Object.freeze({
    key,
    widget: type,
    query,
    display,
    slot: options.slot ?? null,
    size: options.size ?? carried.size ?? WidgetSize.Medium,
    order: options.order ?? 0,
    params: Object.freeze({ ...options.params }),
    ranges: Object.freeze([...ranges]),
    ...(range === undefined ? {} : { range }),
    refreshOn: Object.freeze([...(options.refreshOn ?? query.invalidateOn)]),
    ...(refreshEveryMs === undefined ? {} : { refreshEveryMs }),
    ...(options.permission === undefined ? {} : { permission: options.permission }),
    roles: Object.freeze([...(options.roles ?? [])]),
    ...(options.renderer === undefined ? {} : { renderer: options.renderer }),
    ...(options.placedBy === undefined ? {} : { placedBy: options.placedBy }),
    layer: options.layer ?? PlacementLayer.Owner,
    title: options.title ?? widgetTitle(key),
  });
}
