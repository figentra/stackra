/**
 * Stackra file contract:
 * Purpose: `AREA_CHART_DEMO_KEYS`, the typed keys of the native area-chart demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (Stackra's own charts).
 */
import { keys } from "@stackra/i18n";

/** The area-chart demos' keys. */
export const AREA_CHART_DEMO_KEYS = keys({
  demo_free: {
    area_chart: {
      percent: ["label", "desktop", "mobile"],
      interactive: [
        "desktop",
        "mobile",
        "label",
        "range_7",
        "range_30",
        "range_90",
        "title",
        "description",
        "date",
        "previous",
      ],
      stacked: ["desktop", "mobile", "label"],
      step: ["desktop", "label"],
      axes: ["revenue", "label"],
    },
  },
});
