/**
 * Stackra file contract:
 * Purpose: `SEARCH_RULE_LINE`, the form of one line of the `search.rankingRules` setting: a blank line, a `#` comment,
 *          or one ranking rule of an index:
 *          `<index> pin <phrase>: id, id` (those rows first for that phrase),
 *          `<index> hide <phrase>: id, id` (those rows never for that phrase),
 *          `<index> boost <path>=<value>: <factor>` (matches holding the value scaled by the factor),
 *          `<index> recency <path>: <days>` (relevance halved every that many days of the date's age).
 * Boundary: internal to this package. `SearchSettings`' schema checks every stored line against it, and
 *           `searchRulesOf` reads the rules with its groups: 1 to 4 a pin or hide (index, verb, phrase, ids), 5 to 8 a
 *           boost (index, path, value, factor), 9 to 11 a recency (index, path, days). The index is the model's table,
 *           bare or schema-qualified, as synonyms name it.
 * Runtime: isomorphic
 * Governing contract: ADR 0221; ADR 0307 (rules 22 to 24: runtime values are settings); data-layer gap se11
 *                     (stackra-326).
 */

/** One line of the rules setting; a rule line captures its parts in the groups the header lists. */
export const SEARCH_RULE_LINE =
  /^\s*(?:#.*)?$|^\s*([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)?)\s+(pin|hide)\s+([^:#]+?)\s*:\s*([^\s,:#]+(?:\s*,\s*[^\s,:#]+)*)\s*$|^\s*([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)?)\s+boost\s+([a-z][A-Za-z0-9_.]*)=([^:#]+?)\s*:\s*(\d+(?:\.\d+)?)\s*$|^\s*([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)?)\s+recency\s+([a-z][A-Za-z0-9_.]*)\s*:\s*(\d+(?:\.\d+)?)\s*$/u;
