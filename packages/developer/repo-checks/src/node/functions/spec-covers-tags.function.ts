/**
 * Stackra file contract:
 * Purpose: `specCoversTags(text, key)`, the IDs a test file covers for one spec through `@covers sta-163:FR-001` tags.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */

/**
 * The IDs tagged for the spec `key`, upper-cased.
 *
 * @param text - a test file's text.
 * @param key - the spec key as the tag writes it, prefix and number (`sta-163`, `os-12`), any case.
 * @example
 * specCoversTags("// @covers os-12:FR-001 sta-7:FR-002", "os-12"); // ["FR-001"]
 */
export function specCoversTags(text: string, key: string): string[] {
  const out: string[] = [];
  const own = key.toLowerCase();
  for (const m of text.matchAll(/@covers\s+((?:[a-z][a-z0-9]*-\d+:[A-Z]+(?:-\d+)?[\s,]*)+)/gi))
    for (const t of (m[1] ?? "").matchAll(/([a-z][a-z0-9]*-\d+):([A-Z]+(?:-\d+)?)/gi))
      if ((t[1] ?? "").toLowerCase() === own) out.push((t[2] ?? "").toUpperCase());
  return out;
}
