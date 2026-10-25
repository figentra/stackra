/**
 * Stackra file contract:
 * Purpose: `WidgetDescriptorOptions`, the second argument of `widget(Widget, options)` in a generated widget table: the
 *          placement, the permission and roles, and the renderer of a Custom display.
 * Boundary: a type only. Values the widget class already carries (its key, query, display and size, as a generated
 *           widget ref's statics) are read from it unless given here.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14 and 17 to 19); ADR 0306 (layers); ADR 0336 (decision 4: layer 2b).
 */
import type { EventRef, QueryRef } from "@stackra/clients";
import type { I18nKey } from "@stackra/i18n";
import type { SystemRole } from "@stackra/iam";

import type { PlacementLayer } from "#core/enums/placement-layer.enum";
import type { TimeRange } from "#core/enums/time-range.enum";
import type { WidgetSize } from "#core/enums/widget-size.enum";
import type { DisplayNode } from "#core/types/display-node.type";
import type { SlotRef } from "#core/types/slot-ref.type";
import type { WidgetRenderer } from "#core/types/widget-renderer.type";

/** How a widget is placed and gated. */
export interface WidgetDescriptorOptions {
  /** The widget key, when the class does not carry it. */
  readonly key?: string;

  /** The query ref, when the class does not carry it. */
  readonly query?: QueryRef;

  /** The display, when the class does not carry it. */
  readonly display?: DisplayNode;

  /** The slot, or `null` for a widget only documents place. */
  readonly slot?: SlotRef | null;

  /** The width on a grid. */
  readonly size?: WidgetSize;

  /** The position among the slot's widgets, ascending. */
  readonly order?: number;

  /** Fixed query input, with bound values as bind codes (`actor.accountId`). */
  readonly params?: Readonly<Record<string, unknown>>;

  /** The periods the widget's picker offers. */
  readonly ranges?: readonly TimeRange[];

  /** The period it starts on. */
  readonly range?: TimeRange;

  /** The events that refetch it; the query's `invalidateOn` when absent. */
  readonly refreshOn?: readonly EventRef[];

  /** How often it refetches, at least 30 seconds (`"60s"`). */
  readonly refreshEvery?: string;

  /** The permission it needs: its query's. */
  readonly permission?: string;

  /** The roles whose default dashboard shows it (presentation only). */
  readonly roles?: readonly SystemRole[];

  /** The renderer of a Custom display. */
  readonly renderer?: WidgetRenderer;

  /** The file of the placement shadow that placed it, for the review. */
  readonly placedBy?: string;

  /** The placement layer; the owner's when absent. */
  readonly layer?: PlacementLayer;

  /** The title key; derived from the key when absent (`<module>::widgets.<name>.title`). */
  readonly title?: I18nKey;
}
