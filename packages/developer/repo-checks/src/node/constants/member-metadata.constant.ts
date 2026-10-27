/**
 * Stackra file contract:
 * Purpose: `MEMBER_METADATA`, the npm metadata every member of the Stackra repository carries (ADR 0453 decision 11,
 *          amendment of 2026-10-27): the repository, its tree and issues URLs, the author and the Node engine.
 * Boundary: data only; `npmMetadataFor(dir)` builds a member's fields from it.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 11, amendment of 2026-10-27); ADR 0177 (publishing).
 */

/** The Stackra repository's npm metadata values. */
export const MEMBER_METADATA = Object.freeze({
  /** `repository.url` of every member. */
  repositoryUrl: "git+https://github.com/figentra/stackra.git",
  /** A member's `homepage` is this, its directory and `#readme`. */
  treeUrl: "https://github.com/figentra/stackra/tree/main/",
  /** `bugs.url` of every member. */
  bugsUrl: "https://github.com/figentra/stackra/issues",
  /** `author` of every member. */
  author: "Figentra (https://figentra.com)",
  /** `engines.node`, as the root package.json. */
  node: ">=24.0.0",
});
