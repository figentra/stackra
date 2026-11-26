/**
 * Stackra file contract:
 * Purpose: `frameAncestorsEntry`, the `frameAncestors` entry that governs one path: an exact key first, then the
 *          longest `/*` prefix (which matches below its slash only); undefined when no key matches.
 * Boundary: pure; reads own keys only, so a path never reaches `Object.prototype`. Exported, so a runtime asks its
 *           resolver only on a path whose entry is `"request"`; `frameAncestors` turns the entry into sources.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers); ADR 0334 rule 12.
 */
import type { CspConfig } from "#config/csp.config";

/**
 * The entry that governs `path`.
 *
 * @example
 * frameAncestorsEntry(csp, "/c/cs_01"); // "request"
 * frameAncestorsEntry(csp, "/settings"); // undefined
 */
export function frameAncestorsEntry(
  config: Pick<CspConfig, "frameAncestors">,
  path: string,
): readonly string[] | "request" | undefined {
  if (Object.hasOwn(config.frameAncestors, path)) return config.frameAncestors[path];
  let entry: readonly string[] | "request" | undefined;
  let longest = -1;
  for (const [key, value] of Object.entries(config.frameAncestors)) {
    const prefix = key.slice(0, -1);
    if (key.endsWith("/*") && path.startsWith(prefix) && prefix.length > longest) {
      longest = prefix.length;
      entry = value;
    }
  }
  return entry;
}
