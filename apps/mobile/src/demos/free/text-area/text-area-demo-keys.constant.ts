/**
 * Stackra file contract:
 * Purpose: `TEXT_AREA_DEMO_KEYS`, the typed keys of the native text-area demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The text-area demos' keys. */
export const TEXT_AREA_DEMO_KEYS = keys({
  demo_free: {
    text_area: {
      lines: ["six", "two"],
      live: ["count", "error", "hint", "label"],
      parts: ["hint", "label_only", "placeholder", "with_description", "with_placeholder"],
      states: [
        "disabled",
        "invalid",
        "invalid_message",
        "kept",
        "read_only",
        "required",
        "short_value",
      ],
      variants: ["primary", "secondary"],
      width: ["content", "full"],
    },
  },
});
