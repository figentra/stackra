/**
 * Stackra file contract:
 * Purpose: `secretNamesOf(values)`, the distinct secret names the `$NAME` references in some strings name, in first-
 *          seen order.
 * Boundary: names only; never resolves a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0173 (secret names in git, values never).
 */
import { SECRET_REFERENCE } from "#core/constants/secret-reference.constant";

/**
 * The secret names referenced in `values`.
 *
 * @param values - command arguments, URLs or header values.
 * @example
 * secretNamesOf(["--header", "x-token:$HEROUI_PERSONAL_TOKEN"]); // ["HEROUI_PERSONAL_TOKEN"]
 */
export function secretNamesOf(values: readonly string[]): string[] {
  const names = new Set<string>();
  for (const value of values)
    for (const match of value.matchAll(SECRET_REFERENCE)) if (match[1]) names.add(match[1]);
  return [...names];
}
