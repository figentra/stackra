/**
 * Stackra file contract:
 * Purpose: `BULK_ACTION_BAR_KEYS`, the typed keys of the web Bulk action bar demos' words in `assets/lang/<locale>/bulk_action_bar.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The bulk_action_bar namespace's keys. */
export const BULK_ACTION_BAR_KEYS = keys({
  bulk_action_bar: {
    _: [
      "one",
      "several",
      "nothing",
      "one_action",
      "three_actions",
      "disabled_action",
      "matching",
      "offered",
      "chosen",
      "bar_label",
      "live_label",
      "live_list",
      "selected",
      "last_action",
      "none",
      "archive",
      "export",
      "delete",
      "refund",
      "refund_reason",
      "working",
      "done",
      "failed",
      "failure",
    ],
    sample: ["order_1001", "order_1002", "order_1003", "order_1004", "order_1005"],
  },
});
