/**
 * Stackra file contract:
 * Purpose: `IMPORT_DIALOG_KEYS`, the typed keys of the web ImportDialog demos' words in `assets/lang/<locale>/import_dialog.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The import_dialog namespace's keys. */
export const IMPORT_DIALOG_KEYS = keys({
  import_dialog: {
    _: ["open", "description", "name", "email", "phone", "city"],
    errors: ["open", "bad_email", "no_name", "bad_phone"],
    large: ["open", "description", "sku", "product", "price", "stock"],
  },
});
