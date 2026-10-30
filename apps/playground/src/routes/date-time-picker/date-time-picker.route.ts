/**
 * Stackra file contract:
 * Purpose: the date and time picker route of @figentra/playground: its path. The page it renders is
 *          `date-time-picker.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The Date and time picker page, at `/date-time-picker`. */
export class DateTimePickerRoute extends Route({ path: "/date-time-picker" }) {}
