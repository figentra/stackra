/**
 * Stackra file contract:
 * Purpose: `specKeyPattern(prefixes)`, the regex source that matches any of the spec prefixes the repository uses
 *          (`(?:sta|os)`), and nothing when there are none.
 * Boundary: pure. Prefixes are derived from folder names (lower-case letters and digits), so they need no escaping.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */

/**
 * A non-capturing alternation of the prefixes, or a pattern that never matches for none.
 *
 * @param prefixes - the prefixes of the existing spec folders.
 * @param casing - `lower` (default) for folder names and tags, `upper` for issue keys (`STA`).
 * @example
 * specKeyPattern(["sta", "os"], "upper"); // "(?:STA|OS)"
 */
export function specKeyPattern(
  prefixes: readonly string[],
  casing: "lower" | "upper" = "lower",
): string {
  if (prefixes.length === 0) return "(?!)";
  const cased = prefixes.map((p) => (casing === "upper" ? p.toUpperCase() : p.toLowerCase()));
  return `(?:${cased.join("|")})`;
}
