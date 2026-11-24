/**
 * Stackra file contract:
 * Purpose: `NoteView`, one note as a caller sees it: its public id, title, text and times; the row of the note list and the answer of get and update.
 * Boundary: a shape class in its own file; never the model, so no database id, tenant id or other column leaves the module.
 * Runtime: node
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); ADR 0305 (one declaration per file).
 */
import type { PublicId } from "@stackra/contracts";
import { Schema } from "@stackra/validation";

/** One note as the list and the console show it. */
export class NoteView extends Schema {
  /** The note's public id. */
  id!: PublicId<"not">;

  /** The note's title. */
  title!: string;

  /** The note's text; empty for a title-only note. */
  body!: string;

  /** When the note was written. */
  createdAt!: Date;

  /** When the note was last changed. */
  updatedAt!: Date;
}
