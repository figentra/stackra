/**
 * Stackra file contract:
 * Purpose: `BULK_ACTION_BAR_DEMO_KEYS`, the typed keys of the native bulk-action-bar demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The bulk-action-bar demos' keys. */
export const BULK_ACTION_BAR_DEMO_KEYS = keys({
  demo_free: {
    bulk_action_bar: {
      actions: ["send", "archive", "download", "delete", "export"],
      basics: ["label"],
      overflow: ["label", "more"],
      matching: ["label"],
      states: ["label", "last", "none", "done", "failed", "failure", "export_reason"],
      live: ["label", "select_three", "select_page", "count", "all_yes", "all_no"],
    },
  },
});
