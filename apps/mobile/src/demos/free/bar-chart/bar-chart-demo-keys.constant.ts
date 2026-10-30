/**
 * Stackra file contract:
 * Purpose: `BAR_CHART_DEMO_KEYS`, the typed keys of the native bar-chart demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (Stackra's own charts).
 */
import { keys } from "@stackra/i18n";

/** The bar-chart demos' keys. */
export const BAR_CHART_DEMO_KEYS = keys({
  demo_free: {
    bar_chart: {
      percent: ["label", "desktop", "mobile"],
      multiple: [
        "desktop",
        "mobile",
        "label",
        "title",
        "description",
        "month",
        "previous",
        "target",
      ],
      stacked: ["desktop", "mobile", "label"],
      horizontal: ["desktop", "label"],
      single: ["desktop", "label"],
    },
  },
});
