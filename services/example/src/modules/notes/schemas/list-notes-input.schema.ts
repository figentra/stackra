/**
 * Stackra file contract:
 * Purpose: `ListNotesInput`, the input of `notes.note.list@1`: the cursor of the page to read and its size.
 * Boundary: a shape class in its own file; `CursorInput` gives `cursor` and `limit` (1 to 100, 20 by default).
 * Runtime: node
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); ADR 0305 (one declaration per file).
 */
import { CursorInput } from "@stackra/validation";

/** Which page of notes to read. */
export class ListNotesInput extends CursorInput {}
