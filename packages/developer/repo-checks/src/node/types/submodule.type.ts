/**
 * Stackra file contract:
 * Purpose: `Submodule`, one `[submodule "<name>"]` section of a repository's `.gitmodules`: its name, path and URL.
 * Boundary: type only; `submodulesOf` reads them and `checkSubmodules` judges them.
 * Runtime: node
 * Governing contract: ADR 0526 (decision 4: a root difference is declared with its reason).
 */

/** One submodule as `.gitmodules` declares it. */
export type Submodule = {
  /** The section name, `[submodule "<name>"]`. */
  readonly name: string;

  /** The `path` key, repository-relative; the name when the section has no `path`. */
  readonly path: string;

  /** The `url` key; "" when the section has none. */
  readonly url: string;
};
