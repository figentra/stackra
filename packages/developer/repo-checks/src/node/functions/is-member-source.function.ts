/**
 * Stackra file contract:
 * Purpose: `isMemberSource(path)`, whether a path is member TypeScript the import rule governs; Node-loaded tooling presets,
 *          the two house lint plugins oxlint loads from source (ADR 0421), the showcase's Node-run generator scripts and
 *          lint fixtures are exempt.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0233; ADR 0421 (decision 2: a plugin loaded from source imports values by `./x.ts`).
 */

/**
 * Plain Node loads the tooling presets, the house lint plugins (feature-flags' `src/lint`, and coding-standard's
 * `src/core` files outside its tests) and the showcase's generator scripts (`node scripts/gen.ts`), so they keep
 * `./x.ts`; oxlint's fixtures break the rules on purpose.
 */
const IMPORTS_EXEMPT =
  /^(?:packages\/tooling\/|packages\/design-system\/showcase\/scripts\/|packages\/state\/feature-flags\/src\/lint\/|packages\/developer\/coding-standard\/src\/core\/[^/]+\/[^/]+\.ts$|tools\/scaffold\/templates\/packages\/tooling\/)|\/__tests__\/fixtures\//;

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
