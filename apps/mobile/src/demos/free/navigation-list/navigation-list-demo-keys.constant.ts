/**
 * Stackra file contract:
 * Purpose: `NAVIGATION_LIST_DEMO_KEYS`, the typed keys of the native navigation-list demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The navigation-list demos' keys. */
export const NAVIGATION_LIST_DEMO_KEYS = keys({
  demo_free: {
    navigation_list: {
      groups: ["named"],
      live: ["current"],
      places: [
        "account",
        "billing",
        "favourites",
        "general",
        "home",
        "inbox",
        "notifications",
        "profile",
        "security",
        "settings",
      ],
    },
  },
});
