/**
 * Stackra file contract:
 * Purpose: `TREE_VIEW_DEMO_KEYS`, the typed keys of the native tree-view demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The tree-view demos' keys. */
export const TREE_VIEW_DEMO_KEYS = keys({
  demo_free: {
    tree_view: {
      accounts: [
        "label",
        "assets",
        "cash",
        "bank",
        "receivables",
        "liabilities",
        "payables",
        "vat",
        "revenue",
        "sales",
        "services",
      ],
      categories: [
        "label",
        "selected",
        "beverages",
        "coffee",
        "tea",
        "juices",
        "bakery",
        "bread",
        "pastries",
      ],
      org: [
        "label",
        "opened",
        "none",
        "company",
        "operations",
        "riyadh",
        "jeddah",
        "finance",
        "payroll",
        "it",
      ],
    },
  },
});
