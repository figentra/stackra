/**
 * Stackra file contract:
 * Purpose: `SavedViewGroup`, a saved view's grouping: the row path rows are grouped by and the optional one each group
 *          is sub-grouped by.
 * Boundary: a shape class; it registers this package's own schema for itself when the module loads. Both keys are
 *           declared row paths; a sub-group needs a group.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 14); ADR 0307 (rule 9); ADR 0470 (decision 4); ADR 0305 (one declaration per
 *                     file).
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";

import { ROW_PATH } from "#core/constants/row-path.constant";
import { SAVED_VIEW_GROUP_SCHEMA } from "#core/constants/saved-view-group-schema.constant";

/**
 * The grouping of one saved view.
 *
 * @example
 * SavedViewGroup.create({ by: "status", then: "channel" });
 */
export class SavedViewGroup extends Schema {
  /** The row path rows are grouped by. */
  @Str({ pattern: ROW_PATH })
  by!: string;

  /** The row path each group is sub-grouped by. */
  @Str({ pattern: ROW_PATH })
  // oxlint-disable-next-line unicorn/no-thenable -- reason: `then` is the saved view's sub-group key, not a promise
  then?: string;
}

registerSchemas([[SavedViewGroup, SAVED_VIEW_GROUP_SCHEMA]]);
