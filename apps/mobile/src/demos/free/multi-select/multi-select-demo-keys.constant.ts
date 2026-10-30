/**
 * Stackra file contract:
 * Purpose: `MULTI_SELECT_DEMO_KEYS`, the typed keys of the native multi-select demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The multi-select demos' keys. */
export const MULTI_SELECT_DEMO_KEYS = keys({
  demo_free: {
    multi_select: {
      basics: [
        "collections",
        "collections_hint",
        "placeholder",
        "empty",
        "remove",
        "summer",
        "ramadan",
        "new",
        "best",
        "gifts",
        "eid",
      ],
      states: [
        "read_only",
        "disabled",
        "invalid",
        "dietary",
        "remove",
        "halal",
        "vegan",
        "gluten",
        "spicy",
        "nuts",
      ],
      live: ["dietary", "remove", "chosen", "clear", "halal", "vegan", "gluten", "spicy", "nuts"],
    },
  },
});
