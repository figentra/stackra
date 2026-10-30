/**
 * Stackra file contract:
 * Purpose: `EMPTY_STATE_DEMO_KEYS`, the typed keys of the native empty-state demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The empty-state demos' keys. */
export const EMPTY_STATE_DEMO_KEYS = keys({
  demo_free: {
    empty_state: {
      reasons: {
        no_data: ["title", "description"],
        no_results: ["title", "description"],
        permission_denied: ["title", "description"],
      },
      icons: ["custom", "custom_body", "none", "none_body"],
      actions: ["heading", "body", "create", "import"],
      live: {
        _: ["label", "results", "heading", "body", "clear"],
        fruit: ["apple", "apricot", "banana", "cherry", "fig", "grape", "lemon", "mango"],
      },
    },
  },
});
