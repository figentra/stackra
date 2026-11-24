/**
 * Stackra file contract:
 * Purpose: `CreateNoteAction`, `notes.note.create@1`: add a note to the caller's tenant. `POST /notes` by the endpoint convention, an MCP tool by default (its actors include a user).
 * Boundary: single aggregate, inline `handle`; its permission is `NotePermissions.create` (L2), derived from the key. `NoteService` writes the row inside the action's transaction and under the call's tenant, and the note records `NoteCreated`, which reaches the outbox with the row.
 * Runtime: node
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); ADR 0098; ADR 0305 (one declaration per file).
 */
import { Action, type ActionContext, Idempotency } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";

import { NoteCreated } from "#modules/notes/events/note-created.event";
import { noteViewOf } from "#modules/notes/functions/note-view-of.function";
import type { CreateNoteInput } from "#modules/notes/schemas/create-note-input.schema";
import type { NoteView } from "#modules/notes/schemas/note-view.schema";
import type { NoteService } from "#modules/notes/services/note.service";

/** Not idempotent by itself (POST): each call adds a note, so a client must send `Idempotency-Key`, and a retry with the same key and payload answers the first call's note. */
export class CreateNoteAction extends Action({
  key: "note.create",
  actors: [ActorKind.User, ActorKind.Agent],
  idempotency: Idempotency.Required,
}) {
  private readonly notes: NoteService;

  /**
   * @param notes - writes the row.
   */
  constructor(notes: NoteService) {
    super();
    this.notes = notes;
  }

  /** Stores the note and answers it as stored. */
  async handle(input: CreateNoteInput, _ctx: ActionContext): Promise<NoteView> {
    const note = this.notes.create({ title: input.title, body: input.body ?? "" });
    note.record(NoteCreated.create({ noteId: note.id }));
    return noteViewOf(note);
  }
}
