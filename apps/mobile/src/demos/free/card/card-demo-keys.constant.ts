/**
 * Stackra file contract:
 * Purpose: `CARD_DEMO_KEYS`, the typed keys of the native card demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The card demos' keys. */
export const CARD_DEMO_KEYS = keys({
  demo_free: {
    card: {
      levels: ["card_title", "card_description", "content"],
      anatomy: ["card_title", "card_description", "content", "pay", "later"],
      title_levels: ["outer_title", "outer_description", "inner_title", "inner_content"],
      dismissible: ["card_title", "content", "dismiss", "show_again", "hidden"],
    },
  },
});
