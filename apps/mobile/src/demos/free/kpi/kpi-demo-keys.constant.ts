/**
 * Stackra file contract:
 * Purpose: `KPI_DEMO_KEYS`, the typed keys of the native kpi demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { keys } from "@stackra/i18n";

/** The kpi demos' keys. */
export const KPI_DEMO_KEYS = keys({
  demo_free: {
    kpi: {
      band: ["band", "revenue", "orders", "refunds", "basket", "vs_last"],
      tiles: ["revenue", "customers", "opened", "vs_last"],
    },
  },
});
