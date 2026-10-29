/**
 * Stackra file contract:
 * Purpose: `SAVED_VIEW_SORT_SCHEMA`, the zod schema of `SavedViewSort` this package ships (its `X$`): a row path and a
 *          direction.
 * Boundary: the stand-in for what gen will write for this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 14); ADR 0307 (rules 2 and 9).
 */
import { Enum, SortDirection } from "@stackra/contracts";
import { z } from "zod";

import { ROW_PATH_SCHEMA } from "#core/constants/row-path-schema.constant";

/** The shipped `SavedViewSort$`. */
export const SAVED_VIEW_SORT_SCHEMA = z.object({
  key: ROW_PATH_SCHEMA,
  direction: z.enum(Enum.values(SortDirection)),
});
