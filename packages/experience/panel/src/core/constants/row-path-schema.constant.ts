/**
 * Stackra file contract:
 * Purpose: `ROW_PATH_SCHEMA`, the zod schema of a dotted row path (`totals.totalMinor`) a saved view's keys are written
 *          as.
 * Boundary: the stand-in for the `@Str({ pattern })` rule gen compiles on each row path field; internal, not exported
 *           from the package. Whether the path is declared is `unknownViewKeys`' check, not this schema's.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 6 and 9: views store declared keys only).
 */
import { z } from "zod";

import { ROW_PATH } from "#core/constants/row-path.constant";

/** A dotted row path. */
export const ROW_PATH_SCHEMA = z.string().regex(ROW_PATH, "must be a row path");
