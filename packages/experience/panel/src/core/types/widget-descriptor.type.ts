/**
 * Stackra file contract:
 * Purpose: `WidgetDescriptor`, one widget as the web dashboard and the native widget slot read it: key, query, display,
 *          placement, refresh, gate and renderer.
 * Boundary: a type only; built by `widget(Widget, options)` and registered with `registerWidgets`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14 and 17 to 19); ADR 0164.
 */
import type { AnyClass } from "@stackra/container";
import type { EventRef, QueryRef } from "@stackra/clients";
import type { I18nKey } from "@stackra/i18n";
import type { SystemRole } from "@stackra/iam";

import type { PlacementLayer } from "#core/enums/placement-layer.enum";
import type { TimeRange } from "#core/enums/time-range.enum";
import type { WidgetSize } from "#core/enums/widget-size.enum";
import type { DisplayNode } from "#core/types/display-node.type";
import type { SlotRef } from "#core/types/slot-ref.type";
import type { WidgetRenderer } from "#core/types/widget-renderer.type";

/** One placed widget. */
export interface WidgetDescriptor {
  /** The widget key (`orders.order_kpis`). */
  readonly key: string;

  /** The widget class it was built from. */
  readonly widget: AnyClass;

  /** The query the tile runs. */
  readonly query: QueryRef;

  /** How the answer is shown. */
  readonly display: DisplayNode;

  /** The slot, or `null` when only documents place it. */
  readonly slot: SlotRef | null;

  /** The width on a grid. */
  readonly size: WidgetSize;

  /** The position among the slot's widgets, ascending. */
  readonly order: number;

  /** Fixed query input. */
  readonly params: Readonly<Record<string, unknown>>;

  /** The periods its picker offers; empty when it has none. */
  readonly ranges: readonly TimeRange[];

  /** The period it starts on, when it takes one. */
  readonly range?: TimeRange;

  /** The events that refetch it. */
  readonly refreshOn: readonly EventRef[];

  /** The refetch interval in milliseconds, when it has one. */
  readonly refreshEveryMs?: number;

  /** The permission it needs. */
  readonly permission?: string;

  /** The roles whose default dashboard shows it (presentation only). */
  readonly roles: readonly SystemRole[];

  /** The renderer of a Custom display. */
  readonly renderer?: WidgetRenderer;

  /** The placement shadow that placed it. */
  readonly placedBy?: string;

  /** The placement layer. */
  readonly layer: PlacementLayer;

  /** The title key. */
  readonly title: I18nKey;
}
