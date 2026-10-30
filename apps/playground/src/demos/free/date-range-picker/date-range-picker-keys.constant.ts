/**
 * Stackra file contract:
 * Purpose: `DATE_RANGE_PICKER_KEYS`, the typed keys of the web Date range picker demos' words in `assets/lang/<locale>/date_range_picker.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const DATE_RANGE_PICKER_KEYS = keys({
  date_range_picker: { basics: ["label", "hint", "button"], hijri: ["label", "button"] },
});
