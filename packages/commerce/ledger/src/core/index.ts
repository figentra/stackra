/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/ledger (the `@Journaled` facet, the unbalanced-posting refusal and the
 *          entry types; the database-bound `Journal` and `journalOf` are the `./node` entry) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. No database import: it loads in any runtime. The package has no
 *           table of its own: the entry table is the consumer's model.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0220.
 */
export { Journaled } from "#core/decorators/journaled.decorator";
export { UnbalancedPostingError } from "#core/errors/unbalanced-posting.error";
export type { JournalEntry } from "#core/types/journal-entry.type";
export type { JournalLine } from "#core/types/journal-line.type";
export type { JournalWrite } from "#core/types/journal-write.type";
export type { JournaledOptions } from "#core/types/journaled-options.type";
