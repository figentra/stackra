/**
 * Stackra file contract:
 * Purpose: `SavedViewSort`, a saved view's sort: the row path rows are sorted by and the direction.
 * Boundary: a shape class; it registers this package's own schema for itself when the module loads. The key is a
 *           declared row path, never a query.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 14); ADR 0307 (rules 2 and 9); ADR 0305 (one declaration per file).
 */
import type { SortDirection } from "@stackra/contracts";
import { registerSchemas, Schema, Str } from "@stackra/validation";

import { ROW_PATH } from "#core/constants/row-path.constant";
import { SAVED_VIEW_SORT_SCHEMA } from "#core/constants/saved-view-sort-schema.constant";

/**
 * The sort of one saved view.
 *
 * @example
 * SavedViewSort.create({ key: "createdAt", direction: SortDirection.Desc });
 */
export class SavedViewSort extends Schema {
  /** The row path rows are sorted by. */
  @Str({ pattern: ROW_PATH })
  key!: string;

  /** Ascending or descending. */
  direction!: SortDirection;
}

registerSchemas([[SavedViewSort, SAVED_VIEW_SORT_SCHEMA]]);
