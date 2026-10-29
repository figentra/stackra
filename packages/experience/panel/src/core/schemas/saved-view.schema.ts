/**
 * Stackra file contract:
 * Purpose: `SavedView`, a person's saved view of a resource's table, Linear-style: its filter, sort and columns, its
 *          grouping and sub-grouping, the totals per group, its layout, its version, and whether it is shared with a
 *          role or the whole of the owner's scope.
 * Boundary: a shape class; it registers this package's own schema for itself when the module loads. A view stores
 *           declared keys only, never a query or code; the resource's list query still gates every row. Saved views
 *           are operational records, edited in live (ADR 0359 decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decisions 4 and 14); ADR 0307 (rule 13 as reopened, rules 6 and 9); ADR 0271
 *                     (decisions 2, 3 and 8); ADR 0470 (decision 4).
 */
import { Field, Int, registerSchemas, Schema } from "@stackra/validation";

import { SAVED_VIEW_SCHEMA } from "#core/constants/saved-view-schema.constant";
import type { Aggregate } from "#core/enums/aggregate.enum";
import { ViewLayout } from "#core/enums/view-layout.enum";
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
  /** The filter values by row path. */
  // reason: free filter values keyed by row path; the package's own shipped schema says it
  @Field(SAVED_VIEW_SCHEMA.shape.filter.unwrap())
  filter: Record<string, unknown> = {};

  /** The sort, when it differs from the table's default. */
  // reason: a nested object with no shape class; the package's own shipped schema says it
  @Field(SAVED_VIEW_SCHEMA.shape.sort.unwrap())
  sort?: SortNode;

  /** The row path rows are grouped by, and the one each group is sub-grouped by. */
  // reason: a nested object with no shape class; the package's own shipped schema says it
  @Field(SAVED_VIEW_SCHEMA.shape.group.unwrap())
  group?: { by: string; then?: string };

  /** The totals computed per group. */
  // reason: a nested object with no shape class; the package's own shipped schema says it
  @Field(SAVED_VIEW_SCHEMA.shape.totals.unwrap())
  totals: { key: string; aggregate: Aggregate }[] = [];

  /** The version the store last wrote; a save sends it back and is refused when someone changed the view since. */
  @Int({ min: 1 })
  version = 1;

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

  /** The role key a role copy is shared with; set only when `sharing` is `role`. */
  role?: string;

  /** How the rows are drawn. */
  layout: ViewLayout = ViewLayout.Table;

  /** The row path a board groups by or a calendar places by. */
  layoutBy?: string;

  /** The row paths shown, in order; the table's columns when absent. */
  columns?: string[];
}

registerSchemas([[SavedView, SAVED_VIEW_SCHEMA]]);
