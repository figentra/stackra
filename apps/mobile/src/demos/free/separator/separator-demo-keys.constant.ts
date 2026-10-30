/**
 * Stackra file contract:
 * Purpose: `SEPARATOR_DEMO_KEYS`, the typed keys of the native separator demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The separator demos' keys. */
export const SEPARATOR_DEMO_KEYS = keys({
  demo_free: {
    separator: {
      levels: ["level"],
      live: ["block_a", "block_b", "orientation", "turn"],
      paragraphs: ["after", "before"],
      vertical: ["docs", "pricing", "support"],
    },
  },
});
