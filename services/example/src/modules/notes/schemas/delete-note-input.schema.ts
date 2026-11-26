/**
 * Stackra file contract:
 * Purpose: `DeleteNoteInput`, the input of `notes.note.delete@1`: which note.
 * Boundary: a shape class in its own file; `noteId` is a path parameter of the derived route.
 * Runtime: node
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); ADR 0305 (one declaration per file).
 */
import type { PublicId } from "@stackra/contracts";
import { Schema } from "@stackra/validation";

/** Which note to delete. */
export class DeleteNoteInput extends Schema {
  /** The note's public id. */
  noteId!: PublicId<"not">;
}
