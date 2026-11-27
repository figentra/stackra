/**
 * Stackra file contract:
 * Purpose: `MIGRATION_ID_PATTERN`, the shape of a migration id, `<module>.<NNNN>_<snake stem>`
 *          (`orders.0007_stop_writing_note`), which `Migration({ after })` and a contract step's `{ after }` take.
 * Boundary: a frozen pattern; the one source both checks read, so they never disagree. Only lowercase letters, digits,
 *           underscores and the one dot, so a release gate can build its ledger pattern from it without escaping.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 as amended by ADR 0305 (`after` ids); ADR 0294 (decision 20).
 */

/** A migration id: `<module>.<NNNN>_<snake stem>`. */
export const MIGRATION_ID_PATTERN = /^[a-z][a-z0-9_]*\.\d{4}_[a-z0-9_]+$/;
