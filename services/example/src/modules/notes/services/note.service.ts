/**
 * Stackra file contract:
 * Purpose: `NoteService`, the standard reads and writes of `Note` rows for the note actions and queries.
 * Boundary: runs inside the caller's transaction, under the isolation transaction the pipeline opens for the call, so
 *           the tenant policy applies to every statement; `CrudService` supplies everything and this class adds nothing, so
 *           the model's partner is registered.
 * Runtime: node
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); ADR 0305 (partners); ADR 0239.
 */
import { CrudService } from "@stackra/database";

import type { Note } from "#modules/notes/models/note.model";

/** The note aggregate's service. */
export class NoteService extends CrudService<Note> {}
