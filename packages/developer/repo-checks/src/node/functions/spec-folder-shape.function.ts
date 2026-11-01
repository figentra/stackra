/**
 * Stackra file contract:
 * Purpose: `specFolderShape(prefixes)`, how messages spell the spec folder name: `sta-<n>-<slug>` for one prefix,
 *          `<prefix>-<n>-<slug>` otherwise.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */

/**
 * The folder shape a message names.
 *
 * @param prefixes - the prefixes the repository uses.
 * @example
 * specFolderShape(["sta"]); // "sta-<n>-<slug>"
 */
export function specFolderShape(prefixes: readonly string[]): string {
  return `${prefixes.length === 1 ? prefixes[0] : "<prefix>"}-<n>-<slug>`;
}
