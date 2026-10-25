/**
 * Stackra file contract:
 * Purpose: `BusinessCalendar`, the calendar data one market, tenant, branch or court works to: its time zone, working
 *          week with hours, holiday rules and how uncertain days count.
 * Boundary: a type only, the output of `BusinessCalendar$`, so the type and the check never disagree. The values come
 *           from market-pack data and tenant settings; this package ships none.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 3); ADR 0363 (decision 3: market packs).
 */
import type { z } from "zod";

import type { BUSINESS_CALENDAR_SCHEMA } from "#core/constants/business-calendar-schema.constant";

/** The calendar data of one market, tenant, branch or court. */
export type BusinessCalendar = z.output<typeof BUSINESS_CALENDAR_SCHEMA>;
