/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/ledger (the database-bound `Journal` service and the
 *          `journalOf` token gen wires for a `Journal<Model>` parameter) until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` for the facet, the refusal and the types; the
 *           default field names and the lock TTL stay internal. Never loaded by a browser bundle.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0220.
 */
export { journalOf } from "#node/functions/journal-of.function";
export { Journal } from "#node/services/journal.service";
