/**
 * Stackra file contract:
 * Purpose: `WIDGET_FRAME_DEMO_KEYS`, the typed keys of the native widget-frame demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { keys } from "@stackra/i18n";

/** The widget-frame demos' keys. */
export const WIDGET_FRAME_DEMO_KEYS = keys({
  demo_free: {
    widget_frame: {
      states: ["sales", "range", "visits", "refunds", "view_all", "trend"],
    },
  },
});
