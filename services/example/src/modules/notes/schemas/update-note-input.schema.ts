/**
 * Stackra file contract:
 * Purpose: `UpdateNoteInput`, the input of `notes.note.update@1`: which note, and the title and text to change; a field left out is kept.
 * Boundary: a shape class in its own file; at least one of `title` and `body` is required, which the action checks.
 * Runtime: node
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); ADR 0305 (one declaration per file).
 */
import type { PublicId } from "@stackra/contracts";
import { Schema, Str } from "@stackra/validation";

/** The change to a note. */
export class UpdateNoteInput extends Schema {
  /** The new title, 1 to 120 characters; kept when absent. */
  @Str({
    min: 1,
    max: 120,
  })
  title?: string;

  /** The new text, up to 2000 characters; kept when absent. */
  @Str({ max: 2000 })
  body?: string;

  /** The note's public id. */
  noteId!: PublicId<"not">;
}
