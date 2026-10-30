/**
 * Stackra file contract:
 * Purpose: `SEARCH_FIELD_DEMO_KEYS`, the typed keys of the native search-field demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The search-field demos' keys. */
export const SEARCH_FIELD_DEMO_KEYS = keys({
  demo_free: {
    search_field: {
      basics: ["described", "described_placeholder", "hidden_name", "hint", "label", "placeholder"],
      full_width: ["label"],
      live: {
        _: ["clear", "cleared", "count", "label", "none", "placeholder", "submitted"],
        products: ["blue_shirt", "coffee_mug", "desk_lamp", "floor_lamp", "white_shirt"],
      },
      states: [
        "disabled",
        "invalid",
        "invalid_error",
        "loading",
        "read_only",
        "required",
        "sample",
        "with_value",
      ],
      surfaces: ["primary", "secondary"],
    },
  },
});
