/**
 * Stackra file contract:
 * Purpose: `MIGRATE_FROM_VERSION_SETTING`, the session setting `stackra db migrate` sets in a forward-only environment
 *          to the `schema_migrations` version the run started from, which a contract step's release gate reads to tell
 *          a fresh database (`0`, nothing to protect) and to know it runs under the runner; the release it compares is
 *          `MIGRATE_RELEASE_SETTING`.
 * Boundary: a literal shared by the runner (`migrate`) and the compiler (`releaseGateSql`), so the two never disagree.
 *           Unset in a rollback environment (dev, preview, test) and on every database Encore's runner or a test
 *           applies, where the gate does not hold.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3: destructive steps deferred to a later release; the 2026-10-24 note:
 *                     `stackra db migrate` is the release step).
 */

/** The custom setting holding the version a `stackra db migrate` run started from. */
export const MIGRATE_FROM_VERSION_SETTING = "stackra.migrate_from_version";
