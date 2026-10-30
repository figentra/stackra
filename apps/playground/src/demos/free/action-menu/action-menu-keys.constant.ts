/**
 * Stackra file contract:
 * Purpose: `ACTION_MENU_KEYS`, the typed keys of the web Action menu demos' words in `assets/lang/<locale>/action_menu.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The action_menu namespace's keys. */
export const ACTION_MENU_KEYS = keys({
  action_menu: {
    _: [
      "basics_label",
      "basics_caption",
      "size",
      "variant_label",
      "icon_label",
      "icon_caption",
      "placement_default_label",
      "placement_default_caption",
      "placement_top_label",
      "placement_top_caption",
      "disabled_label",
      "disabled_caption",
      "row_title",
      "open_order",
      "row_opened",
      "last_action",
    ],
    sample: [
      "edit",
      "rename",
      "duplicate",
      "make_a_copy_of_the",
      "danger_zone",
      "archive",
      "delete",
      "paid_orders_cannot_be_archived",
    ],
  },
});
