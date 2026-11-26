/**
 * Stackra file contract:
 * Purpose: `MIGRATE_RELEASE_SETTING`, the session setting `stackra db migrate` sets in a forward-only environment to the
 *          release it applies (`--release`, else `STACKRA_RELEASE`: the deploy's version or commit), which a contract
 *          step's release gate compares with the release recorded against the migration it waits for.
 * Boundary: a literal shared by the runner (`migrate`) and the compiler (`releaseGateSql`), so the two never disagree.
 *           Unset when the run names no release, and wherever `MIGRATE_FROM_VERSION_SETTING` is unset.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3: destructive steps deferred to a later release; the 2026-10-24 note:
 *                     `stackra db migrate` is the release step).
 */

/** The custom setting holding the release a `stackra db migrate` run applies. */
export const MIGRATE_RELEASE_SETTING = "stackra.migrate_release";
