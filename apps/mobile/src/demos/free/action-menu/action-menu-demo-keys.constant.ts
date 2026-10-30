/**
 * Stackra file contract:
 * Purpose: `ACTION_MENU_DEMO_KEYS`, the typed keys of the native action-menu demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The action-menu demos' keys. */
export const ACTION_MENU_DEMO_KEYS = keys({
  demo_free: {
    action_menu: {
      menu: ["open", "edit", "duplicate", "archive", "delete", "actions", "danger"],
      basics: ["label"],
      refused: ["label", "send", "send_note", "refund", "refund_reason"],
      look: ["outline_label", "disabled_label"],
      placement: ["label"],
      live: ["label", "last", "none"],
    },
  },
});
