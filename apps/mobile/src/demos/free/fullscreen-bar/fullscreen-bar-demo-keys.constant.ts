/**
 * Stackra file contract:
 * Purpose: `FULLSCREEN_BAR_DEMO_KEYS`, the typed keys of the native FullscreenBar demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The fullscreen-bar demos' keys. */
export const FULLSCREEN_BAR_DEMO_KEYS = keys({
  demo_free: {
    fullscreen_bar: {
      _: ["exited", "enter_again"],
      register: ["title", "lock", "basket", "hint"],
      locked: ["title", "tickets", "hint"],
      pinned: ["title", "save", "body"],
    },
  },
});
