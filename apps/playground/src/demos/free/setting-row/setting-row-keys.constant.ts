/**
 * Stackra file contract:
 * Purpose: `SETTING_ROW_KEYS`, the typed keys of the web SettingRow demos' words in `assets/lang/<locale>/setting_row.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The setting_row namespace's keys. */
export const SETTING_ROW_KEYS = keys({
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
    "tip_custom",
    "taxes",
    "taxes_hint",
    "payments",
    "payments_hint",
    "staff",
    "staff_hint",
    "manage",
    "manage_label",
    "list",
  ],
});
