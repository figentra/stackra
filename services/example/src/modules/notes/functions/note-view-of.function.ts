/**
 * Stackra file contract:
 * Purpose: `noteViewOf(note)`, the caller-facing `NoteView` of a stored `Note`.
 * Boundary: pure; copies the five fields a caller may see, so the tenant id and every other column stay in the module.
 * Runtime: node
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); ADR 0098; ADR 0305 (one declaration per file).
 */
import type { Note } from "#modules/notes/models/note.model";
import { NoteView } from "#modules/notes/schemas/note-view.schema";

/**
 * The view of `note`.
 *
 * @example
 * noteViewOf(note).title; // "Buy milk"
 */
export function noteViewOf(note: Note): NoteView {
  return NoteView.create({
    id: note.id,
    title: note.title,
    body: note.body,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  });
}
