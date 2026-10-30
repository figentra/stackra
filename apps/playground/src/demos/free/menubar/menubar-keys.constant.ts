/**
 * Stackra file contract:
 * Purpose: `MENUBAR_KEYS`, the typed keys of the web Menubar demos' words in `assets/lang/<locale>/menubar.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const MENUBAR_KEYS = keys({
  menubar: {
    basics: [
      "label",
      "file",
      "edit",
      "view",
      "help",
      "create",
      "output",
      "history",
      "clipboard",
      "zoom",
      "new_order",
      "duplicate",
      "export_csv",
      "print",
      "archive",
      "undo",
      "redo",
      "cut",
      "copy",
      "paste",
      "zoom_in",
      "zoom_out",
      "shortcuts",
      "contact",
      "last",
      "none",
    ],
    checkable: [
      "label",
      "view",
      "sort",
      "columns",
      "density",
      "order",
      "tax",
      "discounts",
      "notes",
      "compact",
      "comfortable",
      "newest",
      "oldest",
      "highest",
      "summary",
      "separator",
    ],
  },
});
