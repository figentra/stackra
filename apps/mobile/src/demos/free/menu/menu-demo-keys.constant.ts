/**
 * Stackra file contract:
 * Purpose: `MENU_DEMO_KEYS`, the typed keys of the native menu demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The menu demos' keys. */
export const MENU_DEMO_KEYS = keys({
  demo_free: {
    menu: {
      basics: ["danger", "delete", "file", "new_file", "open", "open_file"],
      items: [
        "archive",
        "archive_reason",
        "delete",
        "duplicate",
        "edit",
        "edit_note",
        "group",
        "open",
      ],
      live: ["last", "none", "open"],
      multiple: ["chosen", "group", "name", "none", "open", "status", "total"],
      sheet: ["open"],
      single: ["chosen", "group", "newest", "none", "oldest", "open", "price"],
      submenu: ["chat", "copy", "group", "mail", "open", "share"],
    },
  },
});
