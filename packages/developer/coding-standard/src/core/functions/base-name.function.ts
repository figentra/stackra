/**
 * Stackra file contract:
 * Purpose: `baseName`, the last segment of a file path, for the rules that read a file's name and kind suffix.
 * Boundary: pure string work; no `node:path`, so the rules run unchanged wherever oxlint loads them.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (rule R1, the path says the kind); ADR 0305 (one declaration per file).
 */

/**
 * Returns the file name of `path`, after the last `/` or `\`.
 *
 * @example
 * ```ts
 * baseName("src/modules/orders/actions/cancel-order.action.ts"); // "cancel-order.action.ts"
 * ```
 */
export function baseName(path: string): string {
  return path.slice(Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1);
}
