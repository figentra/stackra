/**
 * Stackra file contract:
 * Purpose: `TREE_VIEW_KEYS`, the typed keys of the web Tree view demos' words in `assets/lang/<locale>/tree_view.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The tree_view namespace's keys. */
export const TREE_VIEW_KEYS = keys({
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
    checked: [
      "label",
      "summary",
      "orders",
      "orders_view",
      "orders_refund",
      "catalogue",
      "catalogue_edit",
      "catalogue_prices",
      "reports",
    ],
    lazy: [
      "label",
      "central",
      "western",
      "eastern",
      "olaya",
      "malqa",
      "tahlia",
      "aziziyah",
      "dammam",
      "khobar",
    ],
    drag: ["label", "hint", "hot", "espresso", "latte", "cold", "iced_latte", "lemonade", "sweets"],
  },
});
