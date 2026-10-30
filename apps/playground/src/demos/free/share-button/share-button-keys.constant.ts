/**
 * Stackra file contract:
 * Purpose: `SHARE_BUTTON_KEYS`, the typed keys of the web ShareButton demos' words in
 *          `assets/lang/<locale>/share_button.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const SHARE_BUTTON_KEYS = keys({
  share_button: {
    basics: ["title", "text", "shared", "copied"],
    icon_only: ["product", "price", "label", "text"],
  },
});
