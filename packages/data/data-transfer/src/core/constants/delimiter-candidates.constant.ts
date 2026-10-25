/**
 * Stackra file contract:
 * Purpose: `DELIMITER_CANDIDATES`, the CSV delimiters detection chooses from, in tie-break order.
 * Boundary: format mechanism, not policy: these are the separators spreadsheet tools write. A caller with another
 *           delimiter passes it as an option.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 2).
 */

/** Comma, semicolon, tab and pipe; the first wins a tie. */
export const DELIMITER_CANDIDATES: readonly string[] = [",", ";", "\t", "|"];
