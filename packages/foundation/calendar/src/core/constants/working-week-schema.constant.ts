/**
 * Stackra file contract:
 * Purpose: `WORKING_WEEK_SCHEMA`, the shipped `WorkingWeek$`: the working-week part of `BusinessCalendar$` (each ISO
 *          weekday once, with its `HH:mm` hour ranges), for a resource or branch that keeps its own week.
 * Boundary: shape only, taken from `BusinessCalendar$` so the two never disagree.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0366 (decision 3); STA-1284.
 */
import { BUSINESS_CALENDAR_SCHEMA } from "#core/constants/business-calendar-schema.constant";

/** The shipped `WorkingWeek$`. */
export const WORKING_WEEK_SCHEMA = BUSINESS_CALENDAR_SCHEMA.shape.workingWeek;
