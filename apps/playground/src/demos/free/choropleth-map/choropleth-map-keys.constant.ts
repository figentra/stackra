/**
 * Stackra file contract:
 * Purpose: `CHOROPLETH_MAP_KEYS`, the typed keys of the web Choropleth map demos' words in `assets/lang/<locale>/choropleth_map.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The choropleth_map namespace's keys. */
export const CHOROPLETH_MAP_KEYS = keys({
  choropleth_map: ["label", "north", "east", "south", "west", "centre", "harbour"],
});
