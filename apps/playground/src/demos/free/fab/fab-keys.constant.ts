/**
 * Stackra file contract:
 * Purpose: `FAB_KEYS`, the typed keys of the web Floating action button demos' words in `assets/lang/<locale>/fab.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The fab namespace's keys. */
export const FAB_KEYS = keys({
  fab: [
    "new_order",
    "scan",
    "note",
    "photo",
    "create",
    "chosen",
    "nothing_chosen",
    "area",
    "order_title",
    "customer",
    "customer_value",
    "cancel",
    "close",
    "created",
    "nothing_yet",
    "toast_hint",
    "save_draft",
    "draft_saved",
    "dismiss",
  ],
});
