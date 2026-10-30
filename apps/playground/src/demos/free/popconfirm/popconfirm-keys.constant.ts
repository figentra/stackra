/**
 * Stackra file contract:
 * Purpose: `POPCONFIRM_KEYS`, the typed keys of the web Popconfirm demos' words in `assets/lang/<locale>/popconfirm.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const POPCONFIRM_KEYS = keys({
  popconfirm: {
    basics: [
      "draft",
      "edited",
      "trigger",
      "title",
      "description",
      "confirm",
      "cancel",
      "deleted",
      "restore",
    ],
    async_confirm: ["order", "amount", "trigger", "title", "description", "confirm", "refunded"],
    row_action: [
      "heading",
      "delete",
      "title",
      "confirm",
      "empty",
      "abaya",
      "thobe",
      "shemagh",
      "price",
    ],
  },
});
