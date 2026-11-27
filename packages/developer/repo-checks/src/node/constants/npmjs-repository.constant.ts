/**
 * Stackra file contract:
 * Purpose: `NPMJS_REPOSITORY`, the repository, tree and issues URLs of a member published to npmjs with provenance
 *          (the `create-stackra` initializer, `UNSCOPED_PACKAGES`): npm refuses a provenance publish (E422) unless
 *          `repository.url` names the GitHub repository whose workflow signed the build, which is
 *          `stackra-inc/stackra` since the move of 2026-11-26.
 * Boundary: data only; `npmMetadataFor(dir)` reads it for the folders of `UNSCOPED_PACKAGES`.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27); ADR 0453 (decision 11, amendment of 2026-10-27); STA-2897.
 */

/** The GitHub home that signs an npmjs provenance publish. */
export const NPMJS_REPOSITORY = Object.freeze({
  /** `repository.url` of an npmjs member: the signing repository. */
  repositoryUrl: "git+https://github.com/stackra-inc/stackra.git",
  /** An npmjs member’s `homepage` is this, its directory and `#readme`. */
  treeUrl: "https://github.com/stackra-inc/stackra/tree/main/",
  /** `bugs.url` of an npmjs member. */
  bugsUrl: "https://github.com/stackra-inc/stackra/issues",
});
