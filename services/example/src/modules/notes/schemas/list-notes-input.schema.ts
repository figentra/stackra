/**
 * Stackra file contract:
 * Purpose: `ListNotesInput`, the input of `notes.note.list@1`: the cursor of the page to read and its size.
 * Boundary: a shape class in its own file with the two fields `CursorInput` gives (`limit` 1 to 100, 20 by default, and
 *           `cursor`), not an extension of it: gen compiles each declared field and ignores an inherited field's narrowed
 *           type. The cursor is a note's public id (`not_…`), the only thing the query ever hands out, so a malformed
 *           cursor is refused as invalid input (a client error) before `handle` runs, never thrown from inside the query.
 * Runtime: node
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); the HTTP conventions (cursor
 *                     pagination).
 */
import type { PublicId } from "@stackra/contracts";
import { Int, Schema } from "@stackra/validation";

/** Which page of notes to read. */
export class ListNotesInput extends Schema {
  /** How many notes to return, 1 to 100. */
  @Int({
    min: 1,
    max: 100,
  })
  limit = 20;

  /** The public id of the last note of the previous page; absent for the first page. */
  cursor?: PublicId<"not">;
}
