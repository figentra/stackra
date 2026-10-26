/**
 * Stackra file contract:
 * Purpose: `isMemberSource(path)`, whether a path is member TypeScript the import rule governs; Node-loaded tooling presets,
 *          the feature-flags lint plugin and lint fixtures are exempt.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0233.
 */

/** Plain Node loads the tooling presets and the feature-flags lint plugin (they keep `./x.ts`); oxlint's fixtures break the rules on purpose. */
const IMPORTS_EXEMPT =
  /^(?:packages\/tooling\/|packages\/state\/feature-flags\/src\/lint\/|tools\/scaffold\/templates\/packages\/tooling\/)|\/__tests__\/fixtures\//;

/**
 * True for member TS source the import rule checks.
 *
 * @param path - repository-relative.
 * @example
 * isMemberSource("packages/data/storage/src/core/a.ts"); // true
 */
export function isMemberSource(path: string): boolean {
  return (
    /^(?:apps|packages|services|workers|tools\/scaffold\/templates)\/.+\.(?:ts|tsx|mts)$/.test(
      path,
    ) && !IMPORTS_EXEMPT.test(path)
  );
}
