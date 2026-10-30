/**
 * Stackra file contract:
 * Purpose: `RADIO_GROUP_DEMO_KEYS`, the typed keys of the native radio-group demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The radio-group demos' keys. */
export const RADIO_GROUP_DEMO_KEYS = keys({
  demo_free: {
    radio_group: {
      layouts: ["horizontal", "vertical", "vertical_hint"],
      live: ["apple", "chosen", "label", "pear", "pick_apple", "pick_pear", "plum"],
      methods: ["card", "cash", "transfer"],
      speeds: ["express", "overnight", "standard", "standard_note"],
      states: [
        "disabled",
        "invalid",
        "invalid_error",
        "invalid_hint",
        "option_disabled",
        "read_only",
        "required",
      ],
      variants: ["primary", "secondary"],
    },
  },
});
