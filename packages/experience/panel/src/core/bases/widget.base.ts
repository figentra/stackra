/**
 * Stackra file contract:
 * Purpose: `Widget<Query>({ slot, size, order, params, ranges, range, refreshOn, refreshEvery, roles })`, the kind
 *          base of a query bound to a display: its abstract `display(d)` returns the display, every path checked
 *          against the query's output. `Widget.place(Base, { slot, order, size, params })` is a placement shadow that
 *          moves a widget it does not own.
 * Boundary: called only, with the query as the type argument (gone at runtime: gen reads it); a called form without
 *           it fails with a readable hint (`WithPartner`). Registered as the `widget` kind, not a binding. A widget
 *           never changes what its query returns; `roles` shape presentation only. The owner's options are layer 1,
 *           a placement is layer 2 unless gen marks it an edition's (2b) or the app's (3). `WidgetBase` is the
 *           instance base; the entry exports it as a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14 to 19); ADR 0306 (rules 6 to 8 and the layer table); ADR 0336 (decision 4);
 *                     ADR 0305 (rules 5, 8, 43, 44 and 46); ADR 0294 (decisions 16 and 25).
 */
import type { OutputOf } from "@stackra/actions";
import {
  createKind,
  kindOf,
  registerKind,
  type AnyClass,
  type WithPartner,
} from "@stackra/container";
import { Duration, Enum } from "@stackra/contracts";
import { duration } from "@stackra/validation";

import { PlacementLayer } from "#core/enums/placement-layer.enum";
import { TimeRange } from "#core/enums/time-range.enum";
import { WidgetSize } from "#core/enums/widget-size.enum";
import type { Built } from "#core/types/built.type";
import type { Display } from "#core/types/display.type";
import type { DisplayNode } from "#core/types/display-node.type";
import type { SlotRef } from "#core/types/slot-ref.type";
import type { WidgetOptions } from "#core/types/widget-options.type";
import type { WidgetPlaceOptions } from "#core/types/widget-place-options.type";

/** The shortest refresh interval (ADR 0164, 0294 note). */
const MIN_REFRESH_MS = 30_000;

/** What a placement may change. */
const PLACEMENT_KEYS: ReadonlySet<string> = new Set(["slot", "order", "size", "params", "layer"]);

/** The layers a placement shadow may be set in. */
const PLACEMENT_LAYERS: readonly string[] = [
  PlacementLayer.Host,
  PlacementLayer.Edition,
  PlacementLayer.App,
];

/** The instance side every widget shares: the display it presents its query's answer with. */
export abstract class WidgetBase<Q extends object> {
  /** Type-only kind brand, so a class of another kind cannot stand in for a widget. */
  declare protected readonly "~kind": "widget";

  /** Type-only: the query the widget is bound to. */
  declare protected readonly "~query"?: Q;

  /** The display, every path a key of the query's output. */
  abstract display(display: Display<OutputOf<Q>>): Built<DisplayNode>;
}

/** What a called form without its type argument fails with. */
type Hint = "Name the query as a type argument: Widget<OrderKpisQuery>({ ... })";

/** The called form and the placement shadow. */
interface WidgetForm {
  /** A widget bound to query instance type `Q`. */
  <Q extends object = never>(
    options: WithPartner<Q, WidgetOptions<Q>, Hint>,
  ): abstract new () => WidgetBase<Q>;

  /** A placement shadow of `base`: the same widget, moved. */
  place<W extends AnyClass<WidgetBase<never>>>(base: W, options: WidgetPlaceOptions): W;
}

/** Whether `slot` is absent, `null` or a slot ref. */
function isSlot(slot: unknown): slot is SlotRef | null | undefined {
  return (
    slot === undefined ||
    slot === null ||
    (typeof slot === "object" && typeof (slot as SlotRef).key === "string")
  );
}

/** Checks the fields a placement shares with the owner's options. */
function checkPlacement(
  options: { readonly slot?: unknown; readonly size?: unknown; readonly order?: unknown },
  form: string,
): void {
  if (!isSlot(options.slot))
    throw new TypeError(`${form}({ slot }) is a slot from #stackra/slots or null`);
  const size = options.size;
  if (size !== undefined && !Enum.values(WidgetSize).includes(size as WidgetSize))
    throw new TypeError(`${form}({ size }) is a WidgetSize, got ${JSON.stringify(size)}`);
  const order = options.order;
  if (order !== undefined && !Number.isInteger(order))
    throw new TypeError(`${form}({ order }) is a whole number, got ${JSON.stringify(order)}`);
}

/** Checks the owner's options and records them frozen, in layer 1. */
function read(options: WidgetOptions<object> = {}) {
  checkPlacement(options, "Widget");
  const ranges = options.ranges ?? [];
  const codes: readonly string[] = Enum.values(TimeRange);
  if (!ranges.every((range) => codes.includes(range)))
    throw new TypeError(`Widget({ ranges }) are TimeRange codes, got ${JSON.stringify(ranges)}`);
  if (options.range !== undefined && ranges.length > 0 && !ranges.includes(options.range))
    throw new TypeError(
      `Widget({ range }) is one of its ranges, got ${JSON.stringify(options.range)}`,
    );
  if (options.refreshEvery !== undefined) {
    const milliseconds = Duration.toMilliseconds(duration(options.refreshEvery));
    if (!(milliseconds >= MIN_REFRESH_MS))
      throw new RangeError(
        `Widget({ refreshEvery }) is at least 30 seconds, got ${JSON.stringify(options.refreshEvery)}`,
      );
  }
  if (options.refreshOn?.some((event) => typeof event !== "function") === true)
    throw new TypeError("Widget({ refreshOn }) lists event classes");
  return Object.freeze({ ...options, layer: PlacementLayer.Owner });
}

/**
 * A placement shadow of `base`.
 *
 * @throws TypeError when `base` is not a widget class, or `options` changes something a placement may not.
 */
function place<W extends AnyClass<WidgetBase<never>>>(base: W, options: WidgetPlaceOptions): W {
  const owner = kindOf(base);
  if (owner?.kind !== "widget")
    throw new TypeError("Widget.place(Base, { ... }) places a widget class");
  for (const key of Object.keys(options))
    if (!PLACEMENT_KEYS.has(key))
      throw new TypeError(
        `Widget.place may change only slot, order, size and params, not "${key}"`,
      );
  checkPlacement(options, "Widget.place");
  const layer = options.layer ?? PlacementLayer.Host;
  if (!PLACEMENT_LAYERS.includes(layer))
    throw new TypeError(
      `Widget.place({ layer }) is Host, Edition or App, got ${JSON.stringify(layer)}`,
    );
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: a placement shadow is read by its kind record only
  const Placed = class extends (base as unknown as new () => object) {};
  registerKind(Placed, "widget", { ...owner.options, ...options, layer, placedFrom: base });
  return Placed as unknown as W;
}

/**
 * The widget kind base.
 *
 * @example
 * export class LowStockWidget extends Widget<ListLowStockQuery>({
 *   slot: Slots.Dashboard.Main,
 *   size: WidgetSize.Medium,
 *   params: { limit: 5 },
 * }) {
 *   display(d: Display<ListLowStockOutput>) {
 *     return d.list("items", { primary: "variantId", meta: "available" }).limit(5);
 *   }
 * }
 */
export const Widget = Object.assign(createKind("widget", WidgetBase, read) as object, {
  place,
}) as WidgetForm;
