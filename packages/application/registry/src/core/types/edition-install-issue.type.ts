/**
 * Stackra file contract:
 * Purpose: `EditionInstallIssue`, one reason `planEditionInstall` cannot plan an edition's install.
 * Boundary: a type only. `unknown_module`: the bundle names a module no released manifest declares;
 *           `missing_dependency`: a planned module depends on one that is neither planned nor installed (a base module
 *           the edition does not bundle); `dependency_cycle`: planned modules depend on each other in a loop.
 * Runtime: isomorphic
 * Governing contract: ADR 0335 (decisions 5 and 6); ADR 0214 (decision 3).
 */

/** One planning failure. */
export interface EditionInstallIssue {
  /** What is wrong. */
  readonly code: "unknown_module" | "missing_dependency" | "dependency_cycle";

  /** The module concerned. */
  readonly module: string;

  /** What is wrong, in English. */
  readonly message: string;
}
