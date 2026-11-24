/**
 * Stackra file contract:
 * Purpose: `CreateNoteInput`, the input of `notes.note.create@1`: the note's title and, optionally, its text.
 * Boundary: a shape class in its own file; the rule is the type plus `@Str`, which gen compiles to the schema. The tenant is never a field: it comes from the call.
 * Runtime: node
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); ADR 0305 (one declaration per file).
 */
import { Schema, Str } from "@stackra/validation";

/** The note to add. */
export class CreateNoteInput extends Schema {
  /** The note's title, 1 to 120 characters. */
  @Str({
    min: 1,
    max: 120,
  })
  title!: string;

  /** The note's text, up to 2000 characters; empty when absent. */
  @Str({ max: 2000 })
  body?: string;
}
