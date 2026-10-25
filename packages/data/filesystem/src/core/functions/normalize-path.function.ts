/**
 * Stackra file contract:
 * Purpose: `normalizePath`, the one check every `FileSystem` driver runs on a key before it touches storage: a
 *          relative, `/`-separated key with no `..`, so a key can never reach outside the disk's root or bucket.
 * Boundary: pure; internal to this package (each driver calls it). Empty and `.` segments and a leading `/` are
 *           dropped; a backslash or a NUL is refused rather than guessed at.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decision 7); ADR 0222 (key layout checked by the storage tests).
 */

/**
 * The canonical form of `path`.
 *
 * @throws RangeError when `path` is empty, has a `..` segment, a backslash or a NUL.
 * @example
 * normalizePath("/invoices//2026/./inv_01.pdf"); // "invoices/2026/inv_01.pdf"
 * normalizePath("../etc/passwd"); // throws RangeError
 */
export function normalizePath(path: string): string {
  const segments = path.split("/").filter((segment) => segment !== "" && segment !== ".");
  if (
    segments.length === 0 ||
    segments.includes("..") ||
    path.includes("\\") ||
    path.includes("\0")
  )
    throw new RangeError(`"${path}" is not a file key inside the disk`);
  return segments.join("/");
}
