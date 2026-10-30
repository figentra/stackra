/**
 * Stackra file contract:
 * Purpose: `CHOROPLETH_MAP_DEMO_KEYS`, the typed keys of the native choropleth map demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371.
 */
import { keys } from "@stackra/i18n";

/** The choropleth map demos' keys. */
export const CHOROPLETH_MAP_DEMO_KEYS = keys({
  demo_free: {
    choropleth_map: {
      districts: ["label", "north", "east", "south", "west", "centre", "harbour"],
    },
  },
});
