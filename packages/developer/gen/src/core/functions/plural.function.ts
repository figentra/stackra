/**
 * Stackra file contract:
 * Purpose: `plural`, the English plural of the last word of a snake_case name, for table names and resource paths
 *          (`order_line` to `order_lines`, `access_log_entry` to `access_log_entries`).
 * Boundary: pure; regular English rules only. An irregular noun is written as an `endpoint` override, never
 *           special-cased here, so the derivation stays predictable.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 21: snake_case plural tables, plural URL paths).
 */

/**
 * The plural of `name`'s last word.
 *
 * @example
 * plural("order"); // "orders"
 * plural("access_log_entry"); // "access_log_entries"
 * plural("box"); // "boxes"
 */
export function plural(name: string): string {
  if (/[^aeiou]y$/.test(name)) return `${name.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/.test(name)) return `${name}es`;
  return `${name}s`;
}
