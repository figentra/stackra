/**
 * Stackra file contract:
 * Purpose: `ICON_KEYS`, the typed keys of the web Icon demos' words in `assets/lang/<locale>/icon_page.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The icon_page namespace's keys. */
export const ICON_KEYS = keys({
  icon_page: [
    "inherits",
    "favourites",
    "rated",
    "mirrored",
    "never_mirrored",
    "alias",
    "raw_element",
    "thin_stroke",
    "with_class",
    "next_size",
    "next_tone",
    "state",
  ],
});
