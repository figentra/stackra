/**
 * Stackra file contract:
 * Purpose: `LIGHTBOX_KEYS`, the typed keys of the web Lightbox demos' words in `assets/lang/<locale>/lightbox.json`; the pictures' alt texts and captions stay in the gallery namespace.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const LIGHTBOX_KEYS = keys({
  lightbox: ["label", "open_viewer"],
});
