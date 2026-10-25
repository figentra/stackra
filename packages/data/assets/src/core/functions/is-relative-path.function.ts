/**
 * Stackra file contract:
 * Purpose: `isRelativePath(path)`, the one check an asset path and an asset's source file pass: relative,
 *          `/`-separated, and never leaving its folder.
 * Boundary: pure; internal to this package. Stricter than a disk key: an empty or `.` segment is refused rather than
 *           dropped, because gen writes these paths and a sloppy one is a gen bug.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decisions 2 and 4); ADR 0233 (no `../` into `assets/`).
 */

/**
 * Whether `path` is a non-empty relative path whose segments are all real names.
 *
 * @example
 * isRelativePath("images/eg.svg"); // true
 * isRelativePath("../secrets.json"); // false
 */
export function isRelativePath(path: string): boolean {
  if (path === "" || path.includes("\\") || path.includes("\0")) return false;
  return path.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
}
