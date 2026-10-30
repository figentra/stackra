/**
 * Stackra file contract:
 * Purpose: `COMBO_BOX_DEMO_KEYS`, the typed keys of the native combo-box demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The combo-box demos' keys. */
export const COMBO_BOX_DEMO_KEYS = keys({
  demo_free: {
    combo_box: {
      countries: [
        "ar",
        "ad",
        "au",
        "at",
        "be",
        "br",
        "ca",
        "cl",
        "cz",
        "dk",
        "eg",
        "fi",
        "fr",
        "de",
        "gr",
        "in",
        "it",
        "jp",
        "ke",
        "mx",
        "nl",
        "no",
        "es",
        "se",
      ],
      basics: ["country", "placeholder", "described", "hint"],
      modes: ["single", "multiple"],
      items: [
        "label",
        "placeholder",
        "cairo",
        "cairo_note",
        "berlin",
        "berlin_note",
        "london",
        "london_note",
        "new_york",
        "new_york_note",
        "lisbon",
        "lisbon_note",
      ],
      states: [
        "required",
        "invalid",
        "invalid_error",
        "disabled",
        "read_only",
        "no_match",
        "no_match_message",
      ],
      full_width: ["label"],
      live: ["label", "loading", "no_match", "chosen", "none", "shown"],
    },
  },
});
