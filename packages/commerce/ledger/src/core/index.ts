/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/ledger (`Journal`, the `@Journaled` facet, the `journalOf` token,
 *          the unbalanced-posting refusal and the entry types) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The default field names and the lock TTL stay internal. The
 *           package has no table of its own: the entry table is the consumer's model.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0220.
 */
export { Journaled } from "#core/decorators/journaled.decorator";
export { UnbalancedPostingError } from "#core/errors/unbalanced-posting.error";
export { journalOf } from "#core/functions/journal-of.function";
export { Journal } from "#core/services/journal.service";
export type { JournalEntry } from "#core/types/journal-entry.type";
export type { JournalLine } from "#core/types/journal-line.type";
export type { JournalWrite } from "#core/types/journal-write.type";
export type { JournaledOptions } from "#core/types/journaled-options.type";
