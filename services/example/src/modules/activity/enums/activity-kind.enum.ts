/**
 * Stackra file contract:
 * Purpose: `ActivityKind`, what happened to a note, as one row of a tenant's activity feed says it.
 * Boundary: an `Enum.of` value set; one value per notes event the activity module listens to.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (the `enums/` group); ADR 0305 (one declaration per file).
 */
import { Enum } from "@stackra/contracts";

/**
 * The kinds of activity the feed records.
 *
 * @example
 * entry.kind === ActivityKind.NoteCreated; // "note_created"
 */
export const ActivityKind = Enum.of({
  /** A note was added (`notes.note.created.v1`). */
  NoteCreated: "note_created",
  /** A note's title or text changed (`notes.note.updated.v1`). */
  NoteUpdated: "note_updated",
  /** A note was deleted for good (`notes.note.deleted.v1`). */
  NoteDeleted: "note_deleted",
});

/** One of the kinds above. */
export type ActivityKind = Enum.Value<typeof ActivityKind>;
