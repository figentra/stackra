/**
 * Stackra file contract:
 * Purpose: `RULE_BUILDER_KEYS`, the lang keys of the rule builder's own words in this package's `rules` catalogue
 *          (`assets/lang/<locale>/rules.json`), plus the key of an operator's and a problem's label.
 * Boundary: internal to the `./react` entry (not exported). The stand-in for the typed keys gen writes from the
 *           catalogue; operator and problem keys follow their codes, which the catalogue lists one for one.
 * Runtime: isomorphic
 * Governing contract: ADR 0322 (generated constants instead of string literals); ADR 0305 (rule 1: catalogues);
 *                     naming rule (namespace lookups `<module>::<path>`).
 */
import { type I18nKey, keys } from "@stackra/i18n";

import type { Operator } from "#contracts/index";

/** The builder's keys. */
export const RULE_BUILDER_KEYS = Object.freeze({
  ...keys({
    rules: {
      builder: [
        "match",
        "all",
        "any",
        "not",
        "field",
        "operator",
        "remove",
        "addCondition",
        "addGroup",
        "outcomes",
        "outcome",
        "addOutcome",
      ],
      operands: ["value", "values", "from", "to", "duration", "latitude", "longitude", "radius"],
      hints: ["money", "date", "many", "duration"],
    },
  }).rules,
  /** The label of an operator. */
  operator: (operator: Operator): I18nKey => `rules::operators.${operator}` as I18nKey,
  /** The message of a problem code from `Rules.problems`, `outcomeProblems` or `floorProblems`. */
  problem: (code: string): I18nKey => `rules::problems.${code}` as I18nKey,
});
