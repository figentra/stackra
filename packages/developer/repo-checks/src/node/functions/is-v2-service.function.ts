/**
 * Stackra file contract:
 * Purpose: `isV2Service(paths)`, the transition test until STA-344: a service with an authored `src/main.ts` is the v2 shape;
 *          one without is the v3 shape `pnpm new service` writes.
 * Boundary: pure; STA-344 deletes it with the v2 branch.
 * Runtime: node
 * Governing contract: ADR 0126; ADR 0090; ADR 0294 (rule R12).
 */

/**
 * True when a service's files are the v2 shape (an authored `src/main.ts`).
 *
 * @param paths - the member's files, relative to the member directory.
 * @example
 * isV2Service(["src/main.ts"]); // true
 */
export function isV2Service(paths: readonly string[]): boolean {
  return paths.includes("src/main.ts");
}
