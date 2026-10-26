/**
 * Stackra file contract:
 * Purpose: `ROW_ERROR_SCHEMA`, the shipped `RowError$`: a refused row (its sheet, its row number from 1 and one issue
 *          per refused field: the dotted path, the schema's code and its message).
 * Boundary: shape only, for a service that stores a batch's errors.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0367; STA-1284.
 */
import { z } from "zod";

import type { RowError } from "#contracts/types/row-error.type";

/** The shipped `RowError$`. */
export const ROW_ERROR_SCHEMA: z.ZodType<RowError> = z.object({
  sheet: z.string(),
  row: z.int().min(1),
  issues: z.array(z.object({ field: z.string(), code: z.string().min(1), message: z.string() })),
});
