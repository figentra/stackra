/**
 * Stackra file contract:
 * Purpose: `DASHBOARD_GRID_KEYS`, the typed keys of the web Dashboard grid demos' words in `assets/lang/<locale>/dashboard_grid.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout); STA-1371.
 */
import { keys } from "@stackra/i18n";

/** The dashboard_grid namespace's keys. */
export const DASHBOARD_GRID_KEYS = keys({
  dashboard_grid: [
    "label",
    "edit",
    "range",
    "revenue",
    "orders",
    "customers",
    "refunds",
    "sales_by_day",
    "sales",
    "sat",
    "sun",
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
  ],
});
