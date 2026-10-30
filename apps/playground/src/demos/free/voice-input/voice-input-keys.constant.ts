/**
 * Stackra file contract:
 * Purpose: `VOICE_INPUT_KEYS`, the typed keys of the web VoiceInput demos' words in
 *          `assets/lang/<locale>/voice_input.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const VOICE_INPUT_KEYS = keys({
  voice_input: {
    basics: ["recorded"],
    dictation: ["label", "dictate", "transcript"],
    denied: ["label", "hint"],
  },
});
