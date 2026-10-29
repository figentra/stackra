/**
 * Stackra file contract:
 * Purpose: `SAVED_VIEW_GROUP_SCHEMA`, the zod schema of `SavedViewGroup` this package ships (its `X$`): the row path
 *          rows are grouped by and the optional one each group is sub-grouped by.
 * Boundary: the stand-in for what gen will write for this package. A sub-group needs a group: `by` is required.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 14); ADR 0307 (rule 9); ADR 0470 (decision 4).
 */
import { z } from "zod";

import { ROW_PATH_SCHEMA } from "#core/constants/row-path-schema.constant";

/** The shipped `SavedViewGroup$`. */
export const SAVED_VIEW_GROUP_SCHEMA = z.object({
  by: ROW_PATH_SCHEMA,
  // oxlint-disable-next-line unicorn/no-thenable -- reason: `then` is the saved view's sub-group key, not a promise
  then: ROW_PATH_SCHEMA.exactOptional(),
});
