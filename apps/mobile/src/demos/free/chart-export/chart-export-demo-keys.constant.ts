/**
 * Stackra file contract:
 * Purpose: `CHART_EXPORT_DEMO_KEYS`, the typed keys of the native chart export demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371.
 */
import { keys } from "@stackra/i18n";

/** The chart export demos' keys. */
export const CHART_EXPORT_DEMO_KEYS = keys({
  demo_free: {
    chart_export: {
      sales: ["label", "month", "sales", "jan", "feb", "mar", "apr", "may", "jun"],
      csv_only: ["label", "month", "sales", "jan", "feb", "mar", "apr", "may", "jun"],
    },
  },
});
