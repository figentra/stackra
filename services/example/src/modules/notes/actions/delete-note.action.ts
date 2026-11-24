/**
 * Stackra file contract:
 * Purpose: `DeleteNoteAction`, `notes.note.delete@1`: delete a note for good. `DELETE /notes/:noteId` by the endpoint convention, an MCP tool by default.
 * Boundary: single aggregate, inline `handle`; its permission is `NotePermissions.delete` (L2, the one irreversible verb). A note of another tenant is not found. The note records `NoteDeleted` before the row goes, so the event leaves with the delete.
 * Runtime: node
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); ADR 0098; ADR 0305 (one declaration per file).
 */
import { Action, type ActionContext, Idempotency } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";

import { NoteDeleted } from "#modules/notes/events/note-deleted.event";
import { DeleteNoteOutput } from "#modules/notes/schemas/delete-note-output.schema";
import type { DeleteNoteInput } from "#modules/notes/schemas/delete-note-input.schema";
import type { NoteService } from "#modules/notes/services/note.service";

/** Not found, not a silent success, when the note is already gone (or is another tenant's); a client may send `Idempotency-Key`. */
export class DeleteNoteAction extends Action({
  key: "note.delete",
  actors: [ActorKind.User, ActorKind.Agent],
  idempotency: Idempotency.Optional,
}) {
  private readonly notes: NoteService;

  /**
   * @param notes - reads and deletes the row.
   */
  constructor(notes: NoteService) {
    super();
    this.notes = notes;
  }

  /** Deletes the note and answers its id. */
  async handle(input: DeleteNoteInput, _ctx: ActionContext): Promise<DeleteNoteOutput> {
    const note = await this.notes.findOneOrFail({ id: input.noteId });
    note.record(NoteDeleted.create({ noteId: note.id }));
    await this.notes.delete({ id: note.id });
    return DeleteNoteOutput.create({ id: note.id });
  }
}
