/**
 * Stackra file contract:
 * Purpose: `DATA_TABLE_DEMO_KEYS`, the typed keys of the native data-table demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The data-table demos' keys. */
export const DATA_TABLE_DEMO_KEYS = keys({
  demo_free: {
    data_table: {
      _: ["last", "last_none"],
      columns: ["order", "customer", "status", "total"],
      status: ["paid", "pending", "refunded"],
      actions: [
        "open",
        "archive",
        "delete",
        "refund",
        "refund_reason",
        "opened",
        "archived",
        "refunded",
        "delete_failed",
        "bulk_archived",
        "bulk_delete_failed",
        "failure",
      ],
      basics: ["label"],
      row_actions: ["label"],
      selection: ["label", "selected", "none", "all_yes", "all_no"],
      states: [
        "empty_label",
        "no_results_label",
        "first_load_label",
        "reload_label",
        "search_again",
        "error_label",
        "loading",
        "failure",
        "retries",
      ],
      live: ["label", "search", "matching", "reset"],
      grouped: ["label"],
      tools: ["label", "views", "views_tabs", "views_chips", "view_all", "view_unpaid"],
    },
  },
});
