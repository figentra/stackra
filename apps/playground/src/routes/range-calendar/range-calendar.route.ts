/**
 * Stackra file contract:
 * Purpose: the range calendar route of @figentra/playground: its path. The page it renders is
 *          `range-calendar.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The Range calendar page, at `/range-calendar`. */
export class RangeCalendarRoute extends Route({ path: "/range-calendar" }) {}
