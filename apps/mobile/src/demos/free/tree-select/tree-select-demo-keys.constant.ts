/**
 * Stackra file contract:
 * Purpose: `TREE_SELECT_DEMO_KEYS`, the typed keys of the native TreeSelect demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The TreeSelect demos' keys. */
export const TREE_SELECT_DEMO_KEYS = keys({
  demo_free: {
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
  },
});
