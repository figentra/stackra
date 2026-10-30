/**
 * Stackra file contract:
 * Purpose: `CHIP_DEMO_KEYS`, the typed keys of the native chip demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The chip demos' keys. */
export const CHIP_DEMO_KEYS = keys({
  demo_free: {
    chip: {
      matrix: ["size"],
      icons: ["start", "end", "both"],
      context: [
        "sentence_prefix",
        "sentence_chip",
        "sentence_suffix",
        "design",
        "engineering",
        "support",
      ],
      live: ["next_variant", "next_tone", "current"],
    },
  },
});
