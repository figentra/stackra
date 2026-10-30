/**
 * Stackra file contract:
 * Purpose: `SUNBURST_CHART_DEMO_KEYS`, the typed keys of the native sunburst chart demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371.
 */
import { keys } from "@stackra/i18n";

/** The sunburst chart demos' keys. */
export const SUNBURST_CHART_DEMO_KEYS = keys({
  demo_free: {
    sunburst_chart: {
      categories: [
        "label",
        "revenue",
        "drinks",
        "coffee",
        "tea",
        "juice",
        "food",
        "bakery",
        "sandwiches",
        "retail",
        "beans",
        "merch",
      ],
    },
  },
});
