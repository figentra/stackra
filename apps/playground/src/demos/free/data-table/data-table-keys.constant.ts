/**
 * Stackra file contract:
 * Purpose: `DATA_TABLE_KEYS`, the typed keys of the web Data table demos' words in `assets/lang/<locale>/data_table.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The data_table namespace's keys. */
export const DATA_TABLE_KEYS = keys({
  data_table: [
    "primary",
    "secondary",
    "sorted_label",
    "sorted",
    "row_actions_label",
    "last_action",
    "none",
    "selection_label",
    "selected",
    "all_matching",
    "filter_slot_label",
    "search_label",
    "query",
    "empty_label",
    "no_results_label",
    "first_load_label",
    "reload_label",
    "error_label",
    "loading_text",
    "failure",
    "paging_label",
    "cursor",
    "live_label",
    "live_search",
    "simulate_error",
    "recover",
    "matching",
    "open",
    "archive",
    "delete",
    "refund",
    "refund_reason",
    "failed",
    "done",
    "column_order",
    "column_customer",
    "column_status",
    "column_total",
    "grouped_label",
    "tools_label",
    "views_label",
    "view_all",
    "view_unpaid",
    "facet_label",
    "saved_view_name",
  ],
});
