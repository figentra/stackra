/**
 * Stackra file contract:
 * Purpose: `TABLE_KEYS`, the typed keys of the web Table demos' words in `assets/lang/<locale>/table.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The table namespace's keys. */
export const TABLE_KEYS = keys({
  table: [
    "primary",
    "secondary",
    "sorted_label",
    "sorted",
    "none",
    "single",
    "multiple",
    "selected",
    "sticky_label",
    "empty_label",
    "empty",
    "loading_label",
    "loading_text",
    "reloading_label",
    "live_label",
    "live_sort",
    "live_loaded",
    "reset",
    "column_order",
    "column_customer",
    "column_status",
    "column_total",
    "column_placed",
  ],
});
