/**
 * Stackra file contract:
 * Purpose: `ListNotesOutput`, the output of `notes.note.list@1`: one page of notes, newest first.
 * Boundary: a shape class in its own file; `Page.of` gives `items`, `nextCursor` (absent on the last page) and `hasMore`.
 * Runtime: node
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); ADR 0305 (one declaration per file).
 */
import { Page } from "@stackra/validation";

import { NoteView } from "#modules/notes/schemas/note-view.schema";

/** A page of notes. */
export class ListNotesOutput extends Page.of(NoteView) {}
