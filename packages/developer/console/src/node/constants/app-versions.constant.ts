/**
 * Stackra file contract:
 * Purpose: `APP_VERSIONS`, the exact versions a generated console app pins for its tools, the same pins as the core
 *          catalogs (`pnpm-workspace.yaml`: `typescript` in `build`, `vitest` in `quality`, `@types/node` in the default).
 * Boundary: data only; the generated app lives outside this repository, so it pins versions rather than naming a
 *           catalog. Bumped with the catalogs.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-031; .agents/rules/versions.md (exact pins).
 */

/** Tool versions of a generated app. */
export const APP_VERSIONS = Object.freeze({
  typescript: "7.0.2",
  vitest: "5.0.5",
  "@types/node": "26.6.4",
});
