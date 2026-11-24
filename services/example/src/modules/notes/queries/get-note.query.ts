/**
 * Stackra file contract:
 * Purpose: `GetNoteQuery`, `notes.note.get@1`: one note. `GET /notes/:noteId` by the endpoint convention and an MCP tool (queries are by default).
 * Boundary: read only, uncached; its permission is `NotePermissions.read` (L0). A note of another tenant, or none, is `not_found`.
 * Runtime: node
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); ADR 0098; ADR 0305 (one declaration per file).
 */
import { Query, type QueryContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";

import { noteViewOf } from "#modules/notes/functions/note-view-of.function";
import type { GetNoteInput } from "#modules/notes/schemas/get-note-input.schema";
import type { NoteView } from "#modules/notes/schemas/note-view.schema";
import type { NoteService } from "#modules/notes/services/note.service";

/** Reads one row by its public id. */
export class GetNoteQuery extends Query({
  key: "note.get",
  actors: [ActorKind.User, ActorKind.Agent],
}) {
  private readonly notes: NoteService;

  /**
   * @param notes - reads the row.
   */
  constructor(notes: NoteService) {
    super();
    this.notes = notes;
  }

  /** The note, or `not_found`. */
  async handle(input: GetNoteInput, _ctx: QueryContext): Promise<NoteView> {
    return noteViewOf(await this.notes.findOneOrFail({ id: input.noteId }));
  }
}
