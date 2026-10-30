/**
 * Stackra file contract:
 * Purpose: `TREE_SELECT_KEYS`, the typed keys of the web TreeSelect demos' words in `assets/lang/<locale>/tree_select.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const TREE_SELECT_KEYS = keys({
  tree_select: {
    basics: [
      "label",
      "description",
      "women",
      "abayas",
      "dresses",
      "men",
      "thobes",
      "shemaghs",
      "kids",
    ],
    multiple: [
      "label",
      "description",
      "central",
      "olaya",
      "malqa",
      "western",
      "tahlia",
      "aziziyah",
      "online",
    ],
    invalid: ["label", "error", "finance", "payroll", "accounts", "sales"],
  },
});
