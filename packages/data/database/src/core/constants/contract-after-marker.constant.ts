/**
 * Stackra file contract:
 * Purpose: `CONTRACT_AFTER_MARKER`, the comment line prefix a contract step's release gate carries before the id of the
 *          migration it waits for (`-- stackra:contract-after=orders.0007_stop_writing_note`), so `migrate` can refuse,
 *          before any change, a run that would apply that migration and the contract step together.
 * Boundary: a literal shared by the compiler (`releaseGateSql` writes it) and the runner (`contractAfterIds` reads it),
 *           so the two never disagree. The line sits inside the gate's `do` body, where Postgres reads it as a comment.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3: a destructive step ships in a later release than the change that made it
 *                     safe).
 */

/** The prefix of the comment line naming the migration a contract step waits for. */
export const CONTRACT_AFTER_MARKER = "-- stackra:contract-after=";
