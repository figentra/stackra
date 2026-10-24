/**
 * Stackra file contract:
 * Purpose: `WidgetRef<O>`, the class `widgetRef` returns: a producer's widget (`OrderKpisWidget`) read by its key, its
 *          query and its display options.
 * Boundary: a type only; never instantiated.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (widgets); ADR 0260 (decision 2).
 */
import type { WidgetRefOptions } from "#core/types/widget-ref-options.type";

/** A consumed widget class. */
export type WidgetRef<O extends WidgetRefOptions = WidgetRefOptions> =
  (abstract new () => object) & {
    /** The widget key (`orders.order_kpis`). */
    readonly key: string;

    /** The query the widget reads. */
    readonly query: O["query"];

    /** The display options as declared. */
    readonly options: Readonly<Omit<O, "query">>;
  };
