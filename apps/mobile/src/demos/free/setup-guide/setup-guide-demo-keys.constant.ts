/**
 * Stackra file contract:
 * Purpose: `SETUP_GUIDE_DEMO_KEYS`, the typed keys of the native SetupGuide demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The setup_guide demos' keys. */
export const SETUP_GUIDE_DEMO_KEYS = keys({
  demo_free: {
    setup_guide: [
      "title",
      "description",
      "pos_title",
      "printer",
      "printer_hint",
      "staff",
      "staff_hint",
      "shift",
      "shift_hint",
      "menu",
      "menu_action",
      "next_step",
      "restart",
    ],
  },
});
