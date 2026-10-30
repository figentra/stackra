/**
 * Stackra file contract:
 * Purpose: `SETTING_ROW_DEMO_KEYS`, the typed keys of the native SettingRow demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The setting_row demos' keys. */
export const SETTING_ROW_DEMO_KEYS = keys({
  demo_free: {
    setting_row: [
      "receipts",
      "receipts_hint",
      "sounds",
      "sounds_hint",
      "offline",
      "offline_hint",
      "tips",
      "tips_hint",
      "tip_default",
      "taxes",
      "taxes_hint",
      "manage",
      "manage_label",
    ],
  },
});
