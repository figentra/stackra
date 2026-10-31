/**
 * Stackra file contract:
 * Purpose: `TREE_DIAGRAM_KEYS`, the typed keys of the web Tree diagram demos' words in `assets/lang/<locale>/tree_diagram.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The tree_diagram namespace's keys. */
export const TREE_DIAGRAM_KEYS = keys({
  tree_diagram: [
    "label",
    "company",
    "operations",
    "riyadh",
    "jeddah",
    "technology",
    "platform",
    "mobile",
    "data",
    "sales",
    "retail",
    "wholesale",
  ],
});
