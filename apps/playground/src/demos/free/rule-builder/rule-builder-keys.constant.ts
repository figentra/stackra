/**
 * Stackra file contract:
 * Purpose: `RULE_BUILDER_KEYS`, the typed keys of the web Rule builder demos' words in `assets/lang/<locale>/rule_builder.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The rule_builder namespace's keys. */
export const RULE_BUILDER_KEYS = keys({
  rule_builder: ["label", "total", "city", "tag", "riyadh", "jeddah", "dammam"],
});
