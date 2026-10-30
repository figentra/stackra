/**
 * Stackra file contract:
 * Purpose: `INPUT_GROUP_DEMO_KEYS`, the typed keys of the native input-group demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The input-group demos' keys. */
export const INPUT_GROUP_DEMO_KEYS = keys({
  demo_free: {
    input_group: {
      affixes: ["both", "prefix_only", "suffix_only"],
      elements: ["hide", "hide_label", "password", "profile", "show", "show_label"],
      live: ["hint", "label"],
      states: ["disabled", "invalid", "invalid_message", "read_only", "required"],
      variants: ["primary", "secondary"],
      width: ["content", "full"],
    },
  },
});
