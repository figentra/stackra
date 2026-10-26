/**
 * Stackra file contract:
 * Purpose: `WorkingWeek`, the working week of a `BusinessCalendar` under its own name, so a shape field can be typed
 *          with it (`workingWeek: WorkingWeek | null`) instead of `BusinessCalendar["workingWeek"]`.
 * Boundary: a type only, the output of `WorkingWeek$`.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 3); STA-1284.
 */
import type { z } from "zod";

import type { WORKING_WEEK_SCHEMA } from "#core/constants/working-week-schema.constant";

/** Each working weekday (1 Monday to 7 Sunday) with its hour ranges. */
export type WorkingWeek = z.output<typeof WORKING_WEEK_SCHEMA>;
