/**
 * Stackra file contract:
 * Purpose: `Where<M>`, the filter a read takes: MikroORM's typed filter of `M`, plus `$raw` for one or more
 *          parameterised SQL conditions, ANDed, built with the `sql` tag (`{ $raw: sql\`${StockLevels.columns.onHand} <=
 *          ${n}\` }`) or the operator helpers (`jsonContains`, `jsonPath`, `ancestorOf`, `descendantOf`).
 * Boundary: a type only; `$raw` is the only door for SQL in a filter, and only a `sql` fragment fits it, so values are
 *           always parameters (ADR 0160).
 * Runtime: node
 * Governing contract: ADR 0160 (decision 1: raw SQL only in a module service method, parameterised); ADR 0097.
 */
import type { FilterQuery, RawQueryFragment } from "@mikro-orm/core";

/** A filter of `M`. */
export type Where<M extends object> = FilterQuery<M> & {
  /** One raw condition, or several ANDed, built with `sql` or an operator helper. */
  readonly $raw?: RawQueryFragment | readonly RawQueryFragment[];
};
