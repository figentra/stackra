/**
 * Stackra file contract:
 * Purpose: `LISTBOX_KEYS`, the typed keys of the web Listbox demos' words in `assets/lang/<locale>/listbox.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const LISTBOX_KEYS = keys({
  listbox: {
    branch: ["label", "olaya", "olaya_hint", "malqa", "malqa_hint", "sulay", "sulay_hint"],
    access: [
      "label",
      "orders",
      "view_orders",
      "edit_orders",
      "refund",
      "catalogue",
      "edit_prices",
      "publish",
    ],
    arabic: ["label", "olaya", "olaya_hint", "malqa", "malqa_hint", "sulay", "sulay_hint"],
  },
});
