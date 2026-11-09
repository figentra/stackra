/**
 * Stackra file contract:
 * Purpose: `MARKER_MAP_KEYS`, the typed keys of the web MarkerMap demos' words in
 *          `assets/lang/<locale>/marker_map.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The marker_map namespace's keys. */
export const MARKER_MAP_KEYS = keys({
  marker_map: ["label", "list_label", "selected", "riyadh", "jeddah", "dammam", "madinah", "abha"],
});
