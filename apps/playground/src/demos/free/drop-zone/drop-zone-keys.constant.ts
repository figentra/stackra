/**
 * Stackra file contract:
 * Purpose: `DROP_ZONE_KEYS`, the typed keys of the web Drop zone demos' words in `assets/lang/<locale>/drop_zone.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const DROP_ZONE_KEYS = keys({
  drop_zone: {
    basics: ["label", "hint", "count"],
    paste: ["label", "hint"],
    previews: ["label", "hint"],
  },
});
