/**
 * Stackra file contract:
 * Purpose: `STACKED_METER_KEYS`, the typed keys of the web Stacked meter demos' words in `assets/lang/<locale>/stacked_meter.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The stacked_meter namespace's keys. */
export const STACKED_METER_KEYS = keys({
  stacked_meter: ["label", "videos", "photos", "documents", "other"],
});
