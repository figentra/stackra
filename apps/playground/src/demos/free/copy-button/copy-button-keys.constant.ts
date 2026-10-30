/**
 * Stackra file contract:
 * Purpose: `COPY_BUTTON_KEYS`, the typed keys of the web CopyButton demos' words in `assets/lang/<locale>/copy_button.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The copy_button namespace's keys. */
export const COPY_BUTTON_KEYS = keys({
  copy_button: [
    "order",
    "copy_order",
    "order_copied",
    "api_key",
    "copy_key",
    "key_copied",
    "variant",
  ],
});
