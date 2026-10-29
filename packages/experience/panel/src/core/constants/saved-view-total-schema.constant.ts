/**
 * Stackra file contract:
 * Purpose: `SAVED_VIEW_TOTAL_SCHEMA`, the zod schema of `SavedViewTotal` this package ships (its `X$`): a row path and
 *          the aggregate computed over it per group.
 * Boundary: the stand-in for what gen will write for this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 14); ADR 0307 (rule 9); ADR 0470 (decision 4).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { ROW_PATH_SCHEMA } from "#core/constants/row-path-schema.constant";
import { Aggregate } from "#core/enums/aggregate.enum";

/** The shipped `SavedViewTotal$`. */
export const SAVED_VIEW_TOTAL_SCHEMA = z.object({
  key: ROW_PATH_SCHEMA,
  aggregate: z.enum(Enum.values(Aggregate)),
});
