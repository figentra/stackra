/**
 * Stackra file contract:
 * Purpose: `normalizePrefix`, the check `FileSystem.list` runs on its prefix: the empty prefix stays empty (the whole
 *          disk), any other is normalised like a key and keeps a trailing `/`, so `images/` lists a folder and
 *          `images` also matches `images-2026/`.
 * Boundary: pure; internal to this package (each driver calls it).
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decision 7).
 */
import { normalizePath } from "#core/functions/normalize-path.function";

/**
 * The canonical form of a list prefix.
 *
 * @throws RangeError when `prefix` has a `..` segment, a backslash or a NUL.
 * @example
 * normalizePrefix(""); // ""
 * normalizePrefix("/images/"); // "images/"
 */
export function normalizePrefix(prefix: string): string {
  if (prefix === "" || prefix === "/") return "";
  return normalizePath(prefix) + (prefix.endsWith("/") ? "/" : "");
}
