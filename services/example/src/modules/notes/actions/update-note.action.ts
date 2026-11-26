/**
 * Stackra file contract:
 * Purpose: `UpdateNoteAction`, `notes.note.update@1`: change a note's title or text. `PUT /notes/:noteId` by the endpoint convention, an MCP tool by default.
 * Boundary: single aggregate, inline `handle`; its permission is `NotePermissions.update` (L2). A note of another tenant is not found (the row policy hides it), never forbidden. An update that names neither field is refused with `EmptyNoteUpdateError` before anything is read.
 * Runtime: node
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); ADR 0098; ADR 0305 (one declaration per file).
 */
import { Action, type ActionContext, Idempotency } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";

import { EmptyNoteUpdateError } from "#modules/notes/errors/empty-note-update.error";
import { NoteUpdated } from "#modules/notes/events/note-updated.event";
import { noteViewOf } from "#modules/notes/functions/note-view-of.function";
import type { NoteView } from "#modules/notes/schemas/note-view.schema";
import type { UpdateNoteInput } from "#modules/notes/schemas/update-note-input.schema";
import type { NoteService } from "#modules/notes/services/note.service";

/** Idempotent in effect: the same change twice leaves the same note; a client may send `Idempotency-Key`. */
export class UpdateNoteAction extends Action({
  key: "note.update",
  actors: [ActorKind.User, ActorKind.Agent],
  idempotency: Idempotency.Optional,
}) {
  private readonly notes: NoteService;

  /**
   * @param notes - reads and writes the row.
   */
  constructor(notes: NoteService) {
    super();
    this.notes = notes;
  }

  /** Applies the fields given and answers the note as stored. */
  async handle(input: UpdateNoteInput, _ctx: ActionContext): Promise<NoteView> {
    if (input.title === undefined && input.body === undefined) throw EmptyNoteUpdateError.create();
    const note = await this.notes.update(
      { id: input.noteId },
      {
        ...(input.title === undefined ? {} : { title: input.title }),
        ...(input.body === undefined ? {} : { body: input.body }),
      },
    );
    note.record(NoteUpdated.create({ noteId: note.id }));
    return noteViewOf(note);
  }
}
