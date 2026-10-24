/**
 * Stackra file contract:
 * Purpose: `WidgetRefOptions`, the second argument of `widgetRef`: the query the widget reads and its display options
 *          (display, size, ranges, slot, title).
 * Boundary: a type only. The display options belong to `@stackra/panel`, which reads them from the ref's `options`;
 *           this package keeps them as declared and never interprets them.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (widgets); ADR 0260 (decision 2).
 */
import type { QueryRef } from "#core/types/query-ref.type";

/** What a widget ref declares. */
export interface WidgetRefOptions {
  /** The query whose answer the widget shows. */
  readonly query: QueryRef;

  /** The display options `@stackra/panel` reads. */
  readonly [option: string]: unknown;
}
