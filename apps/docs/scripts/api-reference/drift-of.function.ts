/**
 * Stackra file contract:
 * Purpose: `driftOf(expected, actual)`, the differences between the pages the API reference script renders now and
 *          the pages committed: missing, changed and stale (a page whose package is gone).
 * Boundary: pure; `write-api-reference.ts --check` reads the committed pages and prints what this returns.
 * Runtime: node
 * Governing contract: STA-2857.
 */

/**
 * The drifted pages, one line each, sorted by path.
 *
 * @param expected - the pages the script renders, keyed by path.
 * @param actual - the committed pages under the same keys (index and every `.mdx` in the reference folder).
 * @returns `missing <path>`, `changed <path>` or `stale <path>` lines; empty when the committed pages are current.
 * @example
 * driftOf(new Map([["a.mdx", "x"]]), new Map([["a.mdx", "y"]])); // ["changed a.mdx"]
 */
export function driftOf(
  expected: ReadonlyMap<string, string>,
  actual: ReadonlyMap<string, string>,
): string[] {
  const lines: string[] = [];
  for (const [path, content] of expected) {
    const committed = actual.get(path);
    if (committed === undefined) lines.push(`missing ${path}`);
    else if (committed !== content) lines.push(`changed ${path}`);
  }
  for (const path of actual.keys()) if (!expected.has(path)) lines.push(`stale ${path}`);
  return lines.toSorted((a, b) => {
    const left = a.slice(a.indexOf(" ") + 1);
    const right = b.slice(b.indexOf(" ") + 1);
    return left < right ? -1 : left > right ? 1 : 0;
  });
}
