/**
 * Stackra file contract:
 * Purpose: `SavedView`, a person's saved view of a resource's table, Linear-style: its filter, sort and columns, its
 *          grouping and sub-grouping, the totals per group, and whether it is shared in the owner's scope.
 * Boundary: a shape class; it registers this package's own schema for itself when the module loads. A view stores
 *           declared keys only, never a query or code; the resource's list query still gates every row. Saved views
 *           are operational records, edited in live (ADR 0359 decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decisions 4 and 14); ADR 0307 (rule 13 as reopened, rules 6 and 9).
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { SAVED_VIEW_SCHEMA } from "#core/constants/saved-view-schema.constant";
import type { Aggregate } from "#core/enums/aggregate.enum";
import { ViewSharing } from "#core/enums/view-sharing.enum";
import type { SortNode } from "#core/types/sort-node.type";

/**
 * One saved view.
 *
 * @example
 * validate(SavedView, {
 *   id: "view_1", resource: "orders.order", name: "Open by status", owner: "usr_1",
 *   group: { by: "status" }, totals: [{ key: "totals.totalMinor", aggregate: "sum" }],
 * });
 */
export class SavedView extends Schema {
  /** The view's id. */
  id!: string;

  /** The resource key (`orders.order`). */
  resource!: string;

  /** The name the owner gave it. */
  name!: string;

  /** The owner's principal id. */
  owner!: string;

  /** Who sees it. */
  sharing: ViewSharing = ViewSharing.Private;

  /** The filter values by row path. */
  filter: Record<string, unknown> = {};

  /** The sort, when it differs from the table's default. */
  sort?: SortNode;

  /** The row paths shown, in order; the table's columns when absent. */
  columns?: string[];

  /** The row path rows are grouped by, and the one each group is sub-grouped by. */
  group?: { by: string; then?: string };

  /** The totals computed per group. */
  totals: { key: string; aggregate: Aggregate }[] = [];
}

registerSchemas([[SavedView, SAVED_VIEW_SCHEMA]]);
