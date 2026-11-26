/**
 * Stackra file contract:
 * Purpose: `DeleteNoteOutput`, the output of `notes.note.delete@1`: the id of the note that is gone.
 * Boundary: a shape class in its own file; built with `DeleteNoteOutput.create`, never `new`.
 * Runtime: node
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); ADR 0305 (one declaration per file).
 */
import type { PublicId } from "@stackra/contracts";
import { Schema } from "@stackra/validation";

/** The note that was deleted. */
export class DeleteNoteOutput extends Schema {
  /** The deleted note's public id. */
  id!: PublicId<"not">;
}
