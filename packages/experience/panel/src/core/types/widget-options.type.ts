/**
 * Stackra file contract:
 * Purpose: `WidgetOptions<Q>`, what `Widget<Query>({ ... })` takes: the slot, size, order, fixed params, ranges, refresh
 *          rules and roles.
 * Boundary: a type only; `params` is checked against the query's input and may hold binds. `roles` affects presentation
 *           only: it decides whose default dashboard shows the widget, never who may add it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14 and 17); ADR 0273 (roles shape presentation only).
 */
import type { InputOf } from "@stackra/actions";
import type { AnyClass } from "@stackra/container";
import type { SystemRole } from "@stackra/iam";

import type { TimeRange } from "#core/enums/time-range.enum";
import type { WidgetSize } from "#core/enums/widget-size.enum";
import type { BindRef } from "#core/types/bind-ref.type";
import type { SlotRef } from "#core/types/slot-ref.type";

/** The options of a widget over query instance type `Q`. */
export interface WidgetOptions<Q> {
  /** The slot; absent or `null` for a widget only documents and placements put somewhere. */
  readonly slot?: SlotRef | null;

  /** The width on a grid; Medium by default. */
  readonly size?: WidgetSize;

  /** The position among the slot's widgets, ascending. */
  readonly order?: number;

  /** Fixed query input; a value may be a bind (`Bind.actor("accountId")`). */
  readonly params?: { readonly [K in keyof InputOf<Q>]?: InputOf<Q>[K] | BindRef };

  /** The periods its picker offers. */
  readonly ranges?: readonly TimeRange[];

  /** The period it starts on; one of `ranges`. */
  readonly range?: TimeRange;

  /** Events that refetch an uncached query; derived from the query's `cache.invalidateOn` otherwise. */
  readonly refreshOn?: readonly AnyClass[];

  /** How often it refetches, at least 30 seconds (`"60s"`). */
  readonly refreshEvery?: string;

  /** The roles whose default dashboard shows it. */
  readonly roles?: readonly SystemRole[];
}
