/**
 * Stackra file contract:
 * Purpose: `SavedViewTotal`, one total a saved view computes per group: a row path and its aggregate.
 * Boundary: a shape class; it registers this package's own schema for itself when the module loads. The key is a
 *           declared row path, never a query.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 14); ADR 0307 (rule 9); ADR 0470 (decision 4); ADR 0305 (one declaration per
 *                     file).
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";

import { SAVED_VIEW_TOTAL_SCHEMA } from "#core/constants/saved-view-total-schema.constant";
import type { Aggregate } from "#core/enums/aggregate.enum";

/**
 * One total of a saved view.
 *
 * @example
 * SavedViewTotal.create({ key: "totals.totalMinor", aggregate: Aggregate.Sum });
 */
export class SavedViewTotal extends Schema {
  /** The row path the aggregate runs over. */
  @Str({ pattern: /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/ })
  key!: string;

  /** The aggregate computed per group. */
  aggregate!: Aggregate;
}

registerSchemas([[SavedViewTotal, SAVED_VIEW_TOTAL_SCHEMA]]);
