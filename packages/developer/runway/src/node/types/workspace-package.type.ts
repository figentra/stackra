/**
 * Stackra file contract:
 * Purpose: `WorkspacePackage`, one package of a product repository's `packages/` tree as the product steps read it:
 *          its folder, its version and its `exports`.
 * Boundary: type only; `workspacePackages` builds it.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 2: a product ships packages).
 */

/** One product package. */
export type WorkspacePackage = {
  /** The package folder (absolute). */
  readonly dir: string;
  /** The package version. */
  readonly version: string;
  /** The package.json `exports`. */
  readonly exports: Readonly<Record<string, unknown>>;
};
