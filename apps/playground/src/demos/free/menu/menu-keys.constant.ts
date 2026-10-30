/**
 * Stackra file contract:
 * Purpose: `MENU_KEYS`, the typed keys of the web Menu demos' words in `assets/lang/<locale>/menu.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The menu namespace's keys. */
export const MENU_KEYS = keys({
  menu: {
    _: [
      "order_actions",
      "order_actions_caption",
      "plain",
      "plain_caption",
      "side",
      "side_caption",
      "align",
      "align_caption",
      "item_one",
      "item_two",
      "single_trigger",
      "single_caption",
      "multiple_trigger",
      "multiple_caption",
      "chosen",
      "file_trigger",
      "file_caption",
      "link_trigger",
      "link_caption",
      "disabled_trigger",
      "disabled_caption",
      "live_trigger",
      "last_action",
      "open_state",
      "open_from_outside",
    ],
    sample: [
      "edit",
      "rename",
      "duplicate",
      "make_a_copy_of_the",
      "danger_zone",
      "archive",
      "delete",
      "sort",
      "newest_first",
      "oldest_first",
      "actions",
      "order",
      "ascending",
      "descending",
      "sort_by",
      "name",
      "date",
      "total",
      "columns",
      "order_number",
      "customer",
      "status",
      "go",
      "typography_page",
      "stay_here",
      "file",
      "export",
      "as_pdf",
      "as_csv",
      "print",
      "paid_orders_cannot_be_archived",
    ],
  },
});
