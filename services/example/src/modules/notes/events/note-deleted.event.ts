/**
 * Stackra file contract:
 * Purpose: `NoteDeleted`, a note was deleted.
 * Boundary: an integration event (`note.deleted`, version 1); the notes module hosts it, so it leaves as `notes.note.deleted.v1`. Ids only: never a title or a text. It is recorded on the model and reaches the outbox in the call's transaction, so a rolled-back call announces nothing.
 * Runtime: node
 * Governing contract: ADR 0141 (integration events); ADR 0305 (rule 19).
 */
import type { PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";

/**
 * A note: a note was deleted.
 *
 * @example
 * note.record(NoteDeleted.create({ noteId: note.id }));
 */
export class NoteDeleted extends IntegrationEvent({ name: "note.deleted" }) {
  /** The note's public id. */
  noteId!: PublicId<"not">;
}
