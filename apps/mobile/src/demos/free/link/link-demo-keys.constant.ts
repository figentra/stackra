/**
 * Stackra file contract:
 * Purpose: `LINK_DEMO_KEYS`, the typed keys of the native link demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The link demos' keys. */
export const LINK_DEMO_KEYS = keys({
  demo_free: {
    link: {
      external: ["text"],
      running: ["after", "before", "link"],
      states: ["disabled", "label", "labelled", "press", "presses"],
    },
  },
});
