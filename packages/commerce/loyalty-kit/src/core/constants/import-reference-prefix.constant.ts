/**
 * Stackra file contract:
 * Purpose: the reference prefix of the entry that credits a balance imported from another platform.
 * Boundary: a module-level constant (SCREAMING_SNAKE, ADR 0231); one declaration per file. Used by
 *           `AccountService.importBalance`. The entry is an `earn` so it expires like any earn, counted from the import;
 *           the prefix is what tells an imported credit from a purchase in the ledger.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 2); ADR 0231; STA-1323.
 */

/** An imported credit's reference is this prefix plus the import line's reference, so each line credits once. */
export const IMPORT_REFERENCE_PREFIX = "import:";
