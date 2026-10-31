/**
 * Stackra file contract:
 * Purpose: `RATING_KEYS`, the typed keys of the Rating's own words in `assets/lang/<locale>/ui.json` (`ui::rating.*`).
 * Boundary: keys only; internal. Kept beside `UI_KEYS` so parallel builds never edit that file; fold it in later.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The Rating's keys. */
export const RATING_KEYS = keys({ ui: { rating: ["label", "star", "value"] } });
